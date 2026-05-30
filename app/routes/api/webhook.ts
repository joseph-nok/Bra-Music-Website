import { createHmac, timingSafeEqual } from 'node:crypto'
import { Resend } from 'resend'

type PaystackCustomField = {
  variable_name?: unknown
  value?: unknown
}

type PaystackMetadata = {
  custom_fields?: unknown
  [key: string]: unknown
}

type PaystackPayload = {
  event?: unknown
  data?: {
    amount?: unknown
    reference?: unknown
    customer?: {
      email?: unknown
    }
    metadata?: PaystackMetadata
  }
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

const verifyPaystackSignature = (
  rawBody: string,
  providedSignature: string | null,
) => {
  const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY

  if (!paystackSecretKey || !providedSignature) {
    return false
  }

  const expectedSignature = createHmac('sha512', paystackSecretKey)
    .update(rawBody)
    .digest('hex')

  const expectedBuffer = Buffer.from(expectedSignature, 'hex')
  const providedBuffer = Buffer.from(providedSignature, 'hex')

  return (
    expectedBuffer.length === providedBuffer.length &&
    timingSafeEqual(expectedBuffer, providedBuffer)
  )
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
  try {
    const rawBody = await request.text()
    const signature = request.headers.get('x-paystack-signature')

    if (!verifyPaystackSignature(rawBody, signature)) {
      return jsonResponse({ error: 'Invalid Paystack signature' }, 401)
    }

    const payload = JSON.parse(rawBody) as PaystackPayload

    if (payload.event !== 'charge.success') {
      return jsonResponse({ status: 'received' }, 200)
    }

    const transaction = payload.data
    const metadata = transaction?.metadata
    const amount = formatGhsAmount(transaction?.amount)
    const customerEmail =
      typeof transaction?.customer?.email === 'string'
        ? transaction.customer.email
        : 'N/A'
    const reference =
      typeof transaction?.reference === 'string' ? transaction.reference : 'N/A'
    const customerName = getCustomFieldValue(metadata, 'customer_name')
    const phoneNumber = getCustomFieldValue(metadata, 'phone_number')
    const deliveryInfo = getCustomFieldValue(metadata, 'delivery_info')
    const orderItemsBreakdown = getCustomFieldValue(
      metadata,
      'order_items_breakdown',
    )

    const resend = new Resend(process.env.RESEND_API_KEY)

    await resend.emails.send({
      from: 'Baah Prosper Music <onboarding@resend.dev>',
      to: ['josephnok088@gmail.com'],
      subject: `🔔 New Order: GHS ${amount} from ${customerName}`,
      html: buildOrderEmailHtml({
        amount,
        customerEmail,
        customerName,
        deliveryInfo,
        orderItemsBreakdown,
        phoneNumber,
        reference,
      }),
    })

    return jsonResponse({ status: 'received' }, 200)
  } catch (error) {
    console.error('Paystack webhook processing failed:', error)

    return jsonResponse({ error: 'Webhook processing failed' }, 500)
  }
}
