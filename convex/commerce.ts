import {
  action,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from './_generated/server'
import { internal } from './_generated/api'
import { v } from 'convex/values'
import type { Id } from './_generated/dataModel'

const productLineValidator = v.union(v.literal('merch'), v.literal('cap'))
const sizeValidator = v.union(
  v.literal('M'),
  v.literal('L'),
  v.literal('XL'),
  v.literal('XXL'),
  v.literal('XXXL'),
)
const colorValidator = v.union(
  v.literal('Black'),
  v.literal('White'),
  v.literal('black'),
  v.literal('red'),
  v.literal('white'),
  v.literal('yellow'),
  v.literal('blue'),
)

const checkoutLineValidator = v.object({
  productLine: productLineValidator,
  productId: v.id('marketProducts'),
  quantity: v.number(),
  color: colorValidator,
  size: sizeValidator,
})

type ProductLine = 'merch' | 'cap'

type OrderEmailData = {
  checkoutId: Id<'checkouts'>
  amount: string
  customerEmail: string
  customerName: string
  deliveryInfo: string
  orderItemsBreakdown: string
  phoneNumber: string
  reference: string
  orderNotificationEmailSentAt: number | null
}

type OrderItemSummary = {
  productName: string
  quantity: number
  color: string
  size: string
}

function normalizeQuantity(quantity: number) {
  if (!Number.isFinite(quantity)) {
    throw new Error('Quantity must be a finite number.')
  }
  const normalized = Math.floor(quantity)
  if (normalized < 1) throw new Error('Quantity must be at least 1.')
  return normalized
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function formatGhsAmount(amount: number) {
  if (!Number.isFinite(amount)) return '0.00'
  return amount.toFixed(2)
}

function formatOrderItemsBreakdown(items: OrderItemSummary[]) {
  if (!items.length) return 'N/A'

  return items
    .map((item) => {
      const productName = item.productName.trim() || 'Merch'
      const color = item.color.trim()
      const size = item.size.trim()
      return `${item.quantity}x ${productName} - Color: ${color}, Size: ${size}`
    })
    .join('\n')
}

function buildOrderEmailHtml({
  amount,
  customerEmail,
  customerName,
  deliveryInfo,
  orderItemsBreakdown,
  phoneNumber,
  reference,
}: Omit<OrderEmailData, 'checkoutId' | 'orderNotificationEmailSentAt'>) {
  const rows = [
    ['Customer name', customerName],
    ['Customer email', customerEmail],
    ['Phone number', phoneNumber],
    ['Payment reference', reference],
    ['Amount paid', `GHS ${amount}`],
  ]

  const tableRows = rows
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding: 14px 16px; border-bottom: 1px solid #e5e7eb; color: #475569; font-size: 14px; font-weight: 700; width: 38%;">${escapeHtml(label)}</td>
          <td style="padding: 14px 16px; border-bottom: 1px solid #e5e7eb; color: #111827; font-size: 14px;">${escapeHtml(value)}</td>
        </tr>
      `,
    )
    .join('')

  return `
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>New Order Notification</title>
      </head>
      <body style="margin: 0; padding: 0; background: #f8fafc; font-family: Arial, Helvetica, sans-serif; color: #111827;">
        <div style="display: none; max-height: 0; overflow: hidden; opacity: 0;">
          New paid order from ${escapeHtml(customerName)} for GHS ${escapeHtml(amount)}.
        </div>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #f8fafc; padding: 28px 12px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 680px; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                <tr>
                  <td style="background: #111827; padding: 26px 28px;">
                    <p style="margin: 0 0 8px; color: #cbd5e1; font-size: 13px; letter-spacing: 0.08em; text-transform: uppercase;">Paid order received</p>
                    <h1 style="margin: 0; color: #ffffff; font-size: 26px; line-height: 1.25;">GHS ${escapeHtml(amount)} from ${escapeHtml(customerName)}</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 26px 28px;">
                    <h2 style="margin: 0 0 14px; color: #111827; font-size: 18px; line-height: 1.35;">Order overview</h2>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border: 1px solid #e5e7eb; border-radius: 8px; border-collapse: separate; border-spacing: 0; overflow: hidden;">
                      ${tableRows}
                    </table>

                    <h2 style="margin: 28px 0 12px; color: #111827; font-size: 18px; line-height: 1.35;">Delivery information</h2>
                    <div style="white-space: pre-wrap; background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; color: #111827; font-size: 14px; line-height: 1.65;">${escapeHtml(deliveryInfo)}</div>

                    <h2 style="margin: 28px 0 12px; color: #111827; font-size: 18px; line-height: 1.35;">Order items</h2>
                    <div style="white-space: pre-wrap; background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; color: #111827; font-size: 14px; line-height: 1.65;">${escapeHtml(orderItemsBreakdown)}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `
}

async function sendPaidOrderEmail(order: OrderEmailData) {
  const resendApiKey = process.env.RESEND_API_KEY
  if (!resendApiKey) {
    return { success: false, error: 'RESEND_API_KEY is not configured' }
  }

  const toEmail =
    process.env.ORDER_NOTIFICATION_EMAIL || 'josephnok088@gmail.com'
  const fromEmail =
    process.env.ORDER_NOTIFICATION_FROM ||
    'Orders <orders@baahprospermusic.com>'

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${resendApiKey}`,
    },
    body: JSON.stringify({
      from: fromEmail,
      to: toEmail
        .split(',')
        .map((email) => email.trim())
        .filter(Boolean),
      subject: `New Order: GHS ${order.amount} from ${order.customerName}`,
      html: buildOrderEmailHtml(order),
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    return { success: false, error: `[${response.status}] ${errorText}` }
  }

  return { success: true, error: null }
}

export const startCheckout = mutation({
  args: {
    cartId: v.optional(v.id('carts')),
    items: v.array(checkoutLineValidator),
    email: v.string(),
    momoNumber: v.string(),
    shippingAddress: v.object({
      country: v.string(),
      firstName: v.string(),
      lastName: v.string(),
      phone: v.string(),
      addressLine1: v.string(),
      region: v.string(),
      city: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    if (args.items.length === 0) throw new Error('Cart is empty.')

    // Fetch the upcoming event for payment reference
    const upcomingEvent = await ctx.db
      .query('events')
      .withIndex('by_isPublished', (q) => q.eq('isPublished', true))
      .order('asc')
      .first()

    const eventTitle = upcomingEvent?.title || 'Your Event'

    let totalAmount = 0
    const checkoutItems: Array<{
      productLine: ProductLine
      marketProductId: Id<'marketProducts'>
      productName: string
      productImage: string
      currency: string
      quantity: number
      color: 'Black' | 'White' | 'black' | 'red' | 'white' | 'yellow' | 'blue'
      size: 'M' | 'L' | 'XL' | 'XXL' | 'XXXL'
      unitPrice: number
      lineTotal: number
    }> = []

    for (const item of args.items) {
      const quantity = normalizeQuantity(item.quantity)
      const product = await ctx.db.get(item.productId)
      if (!product || product.productLine !== item.productLine)
        throw new Error('One or more products are unavailable.')
      const lineTotal = quantity * product.price
      totalAmount += lineTotal
      checkoutItems.push({
        productLine: product.productLine,
        marketProductId: product._id,
        productName: product.name,
        productImage: product.image,
        currency: product.currency || 'GHS',
        quantity,
        color: item.color,
        size: item.size,
        unitPrice: product.price,
        lineTotal,
      })
    }

    // Generate payment reference from event
    const generatedPaymentReference = `Purchase for ${eventTitle} ministry`

    const checkoutId = await ctx.db.insert('checkouts', {
      cartId: args.cartId,
      eventId: upcomingEvent?._id,
      status: 'pending',
      paymentMethod: 'MoMo',
      paymentReference: generatedPaymentReference,
      email: args.email.trim().toLowerCase(),
      momoNumber: args.momoNumber.trim(),
      currency: 'GHS',
      totalAmount,
      shippingAddress: args.shippingAddress,
    })

    for (const item of checkoutItems) {
      await ctx.db.insert('checkoutItems', {
        checkoutId,
        productLine: item.productLine,
        marketProductId: item.marketProductId,
        productName: item.productName,
        productImage: item.productImage,
        currency: item.currency,
        quantity: item.quantity,
        color: item.color,
        size: item.size,
        unitPrice: item.unitPrice,
        lineTotal: item.lineTotal,
      })

      // Decrement product stock and set inStock to false if stock reaches 0
      const product = await ctx.db.get(item.marketProductId)
      if (product) {
        const remaining = product.stockQuantity - item.quantity
        await ctx.db.patch(item.marketProductId, {
          stockQuantity: remaining,
          inStock: remaining > 0,
        })
      }
    }

    if (args.cartId) {
      const cart = await ctx.db.get(args.cartId)
      if (cart) await ctx.db.patch(args.cartId, { status: 'converted' })
    }

    return {
      checkoutId,
      totalAmount,
      paymentMethod: 'MoMo',
      paymentReference: generatedPaymentReference,
      eventTitle,
    }
  },
})

export const getCheckout = query({
  args: {
    checkoutId: v.id('checkouts'),
  },
  handler: async (ctx, args) => {
    const checkout = await ctx.db.get(args.checkoutId)
    if (!checkout) {
      return null
    }

    const items = await ctx.db
      .query('checkoutItems')
      .withIndex('by_checkoutId', (q) => q.eq('checkoutId', args.checkoutId))
      .collect()

    return { ...checkout, items }
  },
})

export const completeTestPayment = mutation({
  args: {
    checkoutId: v.id('checkouts'),
  },
  handler: async (ctx, args) => {
    const checkout = await ctx.db.get(args.checkoutId)
    if (!checkout) {
      throw new Error('Checkout not found.')
    }
    if (checkout.status === 'paid') {
      return { checkoutId: args.checkoutId, status: 'paid' as const }
    }
    await ctx.db.patch(args.checkoutId, { status: 'paid' })
    return { checkoutId: args.checkoutId, status: 'paid' as const }
  },
})

export const completePaymentInternal = internalMutation({
  args: { checkoutId: v.id('checkouts') },
  handler: async (ctx, args) => {
    const checkout = await ctx.db.get(args.checkoutId)
    if (!checkout) {
      throw new Error('Checkout not found.')
    }
    if (checkout.status === 'paid') {
      return { alreadyPaid: true }
    }
    await ctx.db.patch(args.checkoutId, { status: 'paid' })
    return { alreadyPaid: false }
  },
})

export const recordOrderNotificationEmailStatus = internalMutation({
  args: {
    checkoutId: v.id('checkouts'),
    success: v.boolean(),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.success) {
      await ctx.db.patch(args.checkoutId, {
        orderNotificationEmailSentAt: Date.now(),
        orderNotificationEmailError: '',
      })
      return
    }

    await ctx.db.patch(args.checkoutId, {
      orderNotificationEmailError: args.error || 'Unknown email error',
    })
  },
})

export const getOrderEmailData = internalQuery({
  args: {
    checkoutId: v.id('checkouts'),
  },
  handler: async (ctx, args): Promise<OrderEmailData> => {
    const checkout = await ctx.db.get(args.checkoutId)
    if (!checkout) {
      throw new Error('Checkout not found.')
    }

    const items = await ctx.db
      .query('checkoutItems')
      .withIndex('by_checkoutId', (q) => q.eq('checkoutId', args.checkoutId))
      .collect()

    const customerName =
      [checkout.shippingAddress.firstName, checkout.shippingAddress.lastName]
        .filter(Boolean)
        .join(' ')
        .trim() || 'Customer'

    const deliveryInfo = [
      customerName,
      checkout.shippingAddress.addressLine1,
      `${checkout.shippingAddress.city}, ${checkout.shippingAddress.region}`,
      checkout.shippingAddress.country,
    ]
      .filter(Boolean)
      .join('\n')

    const orderItemsBreakdown = items.length
      ? formatOrderItemsBreakdown(items)
      : 'N/A'

    return {
      checkoutId: checkout._id,
      amount: formatGhsAmount(checkout.totalAmount),
      customerEmail: checkout.email,
      customerName,
      deliveryInfo,
      orderItemsBreakdown,
      phoneNumber: checkout.shippingAddress.phone || checkout.momoNumber,
      reference: checkout.paymentReference,
      orderNotificationEmailSentAt:
        checkout.orderNotificationEmailSentAt ?? null,
    }
  },
})

export const verifyPaystackPayment = action({
  args: {
    reference: v.string(),
    checkoutId: v.id('checkouts'),
  },
  handler: async (ctx, args) => {
    const secretKey =
      process.env.PAYSTACK_SECRET_KEY || process.env.PAYSTACK_PRIVATE_KEY
    if (!secretKey) {
      throw new Error('PAYSTACK_SECRET_KEY is not configured')
    }

    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${args.reference}`,
      {
        headers: {
          Authorization: `Bearer ${secretKey}`,
        },
      },
    )
    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.message || 'Payment verification request failed')
    }
    if (data.status && data.data?.status === 'success') {
      const order: OrderEmailData = await ctx.runQuery(
        internal.commerce.getOrderEmailData,
        {
          checkoutId: args.checkoutId,
        },
      )
      const paymentResult: { alreadyPaid: boolean } = await ctx.runMutation(
        internal.commerce.completePaymentInternal,
        { checkoutId: args.checkoutId },
      )
      if (order.orderNotificationEmailSentAt) {
        return { success: true, emailSent: true }
      }

      const emailResult = await sendPaidOrderEmail(order)
      await ctx.runMutation(
        internal.commerce.recordOrderNotificationEmailStatus,
        {
          checkoutId: args.checkoutId,
          success: emailResult.success,
          error: emailResult.error ?? '',
        },
      )

      if (!emailResult.success) {
        console.error('Paid order email failed:', emailResult.error)
      }

      return {
        success: true,
        emailSent: emailResult.success,
        emailError: emailResult.success ? null : emailResult.error,
        alreadyPaid: paymentResult.alreadyPaid,
      }
    }
    throw new Error('Payment verification failed')
  },
})
