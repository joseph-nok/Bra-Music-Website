import { mutation, query } from './_generated/server'
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
const colorValidator = v.union(v.literal('Black'), v.literal('White'))

const checkoutLineValidator = v.object({
  productLine: productLineValidator,
  productId: v.id('marketProducts'),
  quantity: v.number(),
  color: colorValidator,
  size: sizeValidator,
})

type ProductLine = 'merch' | 'cap'

function normalizeQuantity(quantity: number) {
  if (!Number.isFinite(quantity)) {
    throw new Error('Quantity must be a finite number.')
  }
  const normalized = Math.floor(quantity)
  if (normalized < 1) throw new Error('Quantity must be at least 1.')
  return normalized
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
      color: 'Black' | 'White'
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
    const generatedPaymentReference = `Purchase for ${eventTitle} from your website`

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
    return await ctx.db.get(args.checkoutId)
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
