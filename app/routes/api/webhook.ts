import { createHmac, timingSafeEqual } from 'node:crypto'
import { ConvexHttpClient } from 'convex/browser'
import { Resend } from 'resend'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import {
  paystackError,
  paystackLog,
  sanitizeForLog,
  sanitizeHeaders,
} from '../../../src/lib/paystack-debug'

type PaystackCustomField = {
  variable_name?: unknown
  value?: unknown
}

type PaystackMetadata = {
  custom_fields?: unknown
  [key: string]: unknown
}

type PaystackTransaction = {
  amount?: unknown
  reference?: unknown
  status?: unknown
  customer?: {
    email?: unknown
  }
  metadata?: PaystackMetadata
}

type PaystackPayload = {
  event?: unknown
  data?: PaystackTransaction
}

type PaystackVerifyResponse = {
  status?: boolean
  message?: string
  data?: PaystackTransaction
}

type CheckoutItem = {
  productName: string
  quantity: number
  color: string
  size: string
}

type CheckoutForEmail = {
  _id: Id<'checkouts'>
  email: string
  momoNumber: string
  paymentReference: string
  totalAmount: number
  shippingAddress: {
    country: string
    firstName: string
    lastName: string
    phone: string
    addressLine1: string
    region: string
    city: string
  }
  items?: CheckoutItem[]
}

const isPaystackCustomField = (value: unknown): value is PaystackCustomField =>
  typeof value === 'object' && value !== null

const jsonResponse = (body: Record<string, string>, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  })

const getCustomFieldValue = (
  metadata: PaystackMetadata | undefined,
  variableName: string,
): string => {
  const directValue =
    typeof metadata === 'object' ? metadata[variableName] : undefined

  if (typeof directValue === 'string' && directValue.trim().length > 0) {
    return directValue
  }

  if (typeof directValue === 'number' || typeof directValue === 'boolean') {
    return String(directValue)
  }

  const customFields =
    typeof metadata === 'object' ? metadata.custom_fields : undefined

  if (!Array.isArray(customFields)) {
    return 'N/A'
  }

  const field = customFields.find(
    (item) =>
      isPaystackCustomField(item) && item.variable_name === variableName,
  )

  if (typeof field?.value === 'string' && field.value.trim().length > 0) {
    return field.value
  }

  if (typeof field?.value === 'number' || typeof field?.value === 'boolean') {
    return String(field.value)
  }

  return 'N/A'
}

const escapeHtml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')

const formatGhsAmount = (amount: unknown): string => {
  const pesewas = typeof amount === 'number' ? amount : Number(amount)

  if (!Number.isFinite(pesewas)) {
    return '0.00'
  }

  return (pesewas / 100).toFixed(2)
}

const formatCheckoutAmount = (amount: number): string => {
  if (!Number.isFinite(amount)) {
    return '0.00'
  }

  return amount.toFixed(2)
}

const formatCheckoutOrderItems = (items: CheckoutItem[]): string => {
  if (!items.length) {
    return 'N/A'
  }

  return items
    .map((item) => {
      const productName = item.productName.trim() || 'Merch'
      return `${item.quantity}x ${productName} - Color: ${item.color.trim()}, Size: ${item.size.trim()}`
    })
    .join('\n')
}

const resolveOrderItemsBreakdown = (
  checkout: CheckoutForEmail | null,
  metadata: PaystackMetadata | undefined,
): string => {
  if (checkout?.items?.length) {
    return formatCheckoutOrderItems(checkout.items)
  }

  return getCustomFieldValue(metadata, 'order_items_breakdown')
}

const extractCheckoutId = (
  reference: string,
  metadata: PaystackMetadata | undefined,
): Id<'checkouts'> | null => {
  const metadataCheckoutId = getCustomFieldValue(metadata, 'checkout_id')
  if (metadataCheckoutId !== 'N/A') {
    return metadataCheckoutId as Id<'checkouts'>
  }

  const referenceCheckoutId = reference.split('_')[0]?.trim()
  return referenceCheckoutId ? (referenceCheckoutId as Id<'checkouts'>) : null
}

const getConvexUrl = () =>
  process.env.CONVEX_URL ||
  process.env.VITE_CONVEX_URL ||
  process.env.NEXT_PUBLIC_CONVEX_URL ||
  ''

const getCheckoutForEmail = async (
  checkoutId: Id<'checkouts'> | null,
  reference: string,
): Promise<CheckoutForEmail | null> => {
  const convexUrl = getConvexUrl()
  if (!checkoutId || !convexUrl) {
    paystackLog('PAYSTACK WEBHOOK', 'Skipping checkout lookup', {
      reference,
      checkoutId: checkoutId ?? undefined,
      hasConvexUrl: Boolean(convexUrl),
    })
    return null
  }

  try {
    paystackLog('PAYSTACK WEBHOOK', 'Loading checkout from Convex', {
      reference,
      checkoutId,
    })
    const convex = new ConvexHttpClient(convexUrl)
    const checkout = (await convex.query(api.commerce.getCheckout, {
      checkoutId,
    })) as CheckoutForEmail | null
    paystackLog('PAYSTACK WEBHOOK', 'Checkout lookup completed', {
      reference,
      checkoutId,
      found: Boolean(checkout),
      itemCount: checkout?.items?.length ?? 0,
    })
    return checkout
  } catch (error) {
    paystackError(
      'PAYSTACK WEBHOOK',
      'Could not load checkout for order email',
      { reference, checkoutId },
      error,
    )
    return null
  }
}

const fetchVerifiedTransaction = async (
  reference: string,
): Promise<PaystackTransaction | null> => {
  const secretKey =
    process.env.PAYSTACK_SECRET_KEY || process.env.PAYSTACK_PRIVATE_KEY
  const verifyUrl = `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`

  if (!secretKey) {
    paystackError('PAYSTACK WEBHOOK', 'Paystack verify skipped: secret key missing', {
      reference,
    })
    return null
  }

  paystackLog('PAYSTACK WEBHOOK', 'Fetching verified transaction from Paystack', {
    reference,
    verifyUrl,
  })

  try {
    const response = await fetch(verifyUrl, {
      headers: {
        Authorization: `Bearer ${secretKey}`,
      },
    })
    const data = (await response.json()) as PaystackVerifyResponse

    paystackLog('PAYSTACK WEBHOOK', 'Paystack verify response received', {
      reference,
      httpStatus: response.status,
      paystackStatus: data.status,
      transactionStatus: data.data?.status,
      hasMetadata: Boolean(data.data?.metadata),
      responseBody: sanitizeForLog(data as Record<string, unknown>),
    })

    if (!response.ok || !data.status || data.data?.status !== 'success') {
      paystackError('PAYSTACK WEBHOOK', 'Paystack verify failed for webhook', {
        reference,
        httpStatus: response.status,
        message: data.message,
      })
      return null
    }

    paystackLog('PAYSTACK WEBHOOK', 'Paystack verify succeeded', {
      reference,
      amount: data.data?.amount,
      customerEmail: data.data?.customer?.email,
    })
    return data.data ?? null
  } catch (error) {
    paystackError(
      'PAYSTACK WEBHOOK',
      'Paystack verify request failed',
      { reference },
      error,
    )
    return null
  }
}

const verifyPaystackSignature = (
  rawBody: string,
  providedSignature: string | null,
  reference?: string,
) => {
  const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY

  if (!paystackSecretKey || !providedSignature) {
    paystackError('PAYSTACK WEBHOOK', 'Signature verification failed: missing secret or header', {
      reference,
      hasSecretKey: Boolean(paystackSecretKey),
      hasSignatureHeader: Boolean(providedSignature),
    })
    return false
  }

  const expectedSignature = createHmac('sha512', paystackSecretKey)
    .update(rawBody)
    .digest('hex')

  const expectedBuffer = Buffer.from(expectedSignature, 'hex')
  const providedBuffer = Buffer.from(providedSignature, 'hex')

  const isValid =
    expectedBuffer.length === providedBuffer.length &&
    timingSafeEqual(expectedBuffer, providedBuffer)

  if (!isValid) {
    paystackError('PAYSTACK WEBHOOK', 'Signature mismatch', {
      reference,
      signatureLength: providedSignature.length,
    })
  } else {
    paystackLog('PAYSTACK WEBHOOK', 'Signature verification passed', {
      reference,
    })
  }

  return isValid
}

const buildOrderEmailHtml = ({
  amount,
  customerEmail,
  customerName,
  deliveryInfo,
  orderItemsBreakdown,
  phoneNumber,
  reference,
}: {
  amount: string
  customerEmail: string
  customerName: string
  deliveryInfo: string
  orderItemsBreakdown: string
  phoneNumber: string
  reference: string
}) => {
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

export const POST = async ({ request }: { request: Request }) => {
  paystackLog('PAYSTACK WEBHOOK', 'Incoming request')

  try {
    const rawBody = await request.text()
    const signature = request.headers.get('x-paystack-signature')

    paystackLog('PAYSTACK WEBHOOK', 'Request headers received', {
      headers: sanitizeHeaders(request.headers),
      bodyLength: rawBody.length,
    })
    paystackLog('PAYSTACK WEBHOOK', 'Raw body received', {
      rawBody,
    })

    let payload: PaystackPayload
    try {
      payload = JSON.parse(rawBody) as PaystackPayload
    } catch (parseError) {
      paystackError(
        'PAYSTACK WEBHOOK',
        'Failed to parse webhook body as JSON',
        { rawBodyPreview: rawBody.slice(0, 500) },
        parseError,
      )
      return jsonResponse({ error: 'Invalid webhook payload' }, 400)
    }

    const preliminaryReference =
      typeof payload.data?.reference === 'string'
        ? payload.data.reference
        : undefined

    paystackLog('PAYSTACK WEBHOOK', 'Parsed event', {
      reference: preliminaryReference,
      event: payload.event,
      parsedPayload: sanitizeForLog(payload as Record<string, unknown>),
    })

    if (!verifyPaystackSignature(rawBody, signature, preliminaryReference)) {
      paystackError('PAYSTACK WEBHOOK', 'Rejecting webhook due to invalid signature', {
        reference: preliminaryReference,
      })
      return jsonResponse({ error: 'Invalid Paystack signature' }, 401)
    }

    paystackLog('PAYSTACK WEBHOOK', 'Event type received', {
      reference: preliminaryReference,
      eventType: payload.event,
    })

    if (payload.event !== 'charge.success') {
      paystackLog('PAYSTACK WEBHOOK', 'Ignoring non-charge.success event', {
        reference: preliminaryReference,
        eventType: payload.event,
      })
      return jsonResponse({ status: 'received' }, 200)
    }

    const webhookTransaction = payload.data
    const webhookReference =
      typeof webhookTransaction?.reference === 'string'
        ? webhookTransaction.reference
        : 'N/A'

    paystackLog('PAYSTACK WEBHOOK', 'Processing charge.success', {
      reference: webhookReference,
      amount: webhookTransaction?.amount,
      customerEmail: webhookTransaction?.customer?.email,
      hasWebhookMetadata: Boolean(webhookTransaction?.metadata),
    })

    const verifiedTransaction =
      webhookReference !== 'N/A'
        ? await fetchVerifiedTransaction(webhookReference)
        : null
    const transaction = verifiedTransaction ?? webhookTransaction
    const metadata =
      transaction?.metadata ?? webhookTransaction?.metadata ?? {}
    const amount = formatGhsAmount(transaction?.amount)
    const customerEmail =
      typeof transaction?.customer?.email === 'string'
        ? transaction.customer.email
        : 'N/A'
    const reference =
      typeof transaction?.reference === 'string'
        ? transaction.reference
        : webhookReference
    const checkoutId = extractCheckoutId(reference, metadata)

    paystackLog('PAYSTACK WEBHOOK', 'Resolved transaction context', {
      reference,
      checkoutId: checkoutId ?? undefined,
      amountGhs: amount,
      customerEmail,
      metadataSource: verifiedTransaction ? 'verify-api' : 'webhook-payload',
      metadata: sanitizeForLog(metadata),
    })

    const checkout = await getCheckoutForEmail(checkoutId, reference)
    const checkoutCustomerName = checkout
      ? [
          checkout.shippingAddress.firstName,
          checkout.shippingAddress.lastName,
        ]
          .filter(Boolean)
          .join(' ')
          .trim()
      : ''
    const customerName =
      checkoutCustomerName || getCustomFieldValue(metadata, 'customer_name')
    const phoneNumber =
      checkout?.shippingAddress.phone ||
      checkout?.momoNumber ||
      getCustomFieldValue(metadata, 'phone_number')
    const deliveryInfo = checkout
      ? [
          customerName,
          checkout.shippingAddress.addressLine1,
          `${checkout.shippingAddress.city}, ${checkout.shippingAddress.region}`,
          checkout.shippingAddress.country,
        ]
          .filter(Boolean)
          .join('\n')
      : getCustomFieldValue(metadata, 'delivery_info')
    const orderItemsBreakdown = resolveOrderItemsBreakdown(checkout, metadata)
    const displayAmount = checkout
      ? formatCheckoutAmount(checkout.totalAmount)
      : amount
    const displayCustomerEmail = checkout?.email || customerEmail

    paystackLog('PAYSTACK WEBHOOK', 'Prepared order email payload', {
      reference,
      checkoutId: checkoutId ?? undefined,
      customerName,
      displayAmount,
      displayCustomerEmail,
      phoneNumber,
      orderItemsBreakdown,
      deliveryInfoPreview: deliveryInfo.slice(0, 200),
    })

    const resend = new Resend(process.env.RESEND_API_KEY)

    await resend.emails.send({
      from: 'Baah Prosper Music <onboarding@resend.dev>',
      to: ['josephnok088@gmail.com'],
      subject: `🔔 New Order: GHS ${displayAmount} from ${customerName}`,
      html: buildOrderEmailHtml({
        amount: displayAmount,
        customerEmail: displayCustomerEmail,
        customerName,
        deliveryInfo,
        orderItemsBreakdown,
        phoneNumber,
        reference,
      }),
    })

    paystackLog('PAYSTACK WEBHOOK', 'Webhook processing succeeded', {
      reference,
      checkoutId: checkoutId ?? undefined,
      emailSent: true,
    })

    return jsonResponse({ status: 'received' }, 200)
  } catch (error) {
    paystackError('PAYSTACK WEBHOOK', 'Webhook processing failed', undefined, error)

    return jsonResponse({ error: 'Webhook processing failed' }, 500)
  }
}
