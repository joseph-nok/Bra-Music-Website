import { createServerFn, useServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import { paystackError, paystackLog, sanitizeForLog } from './src/lib/paystack-debug'

declare const process: {
  env: {
    PAYSTACK_SECRET_KEY?: string
  }
}

// ==========================================
// 1. TYPES & INTERFACES
// ==========================================
export interface CartItem {
  name: string
  color?: string
  size: string
  quantity: number
}

export interface CheckoutInput {
  email: string
  amountGhs: number
  customerName: string
  phone: string
  address: string
  city: string
  region: string
  cart: CartItem[]
}

interface PaystackInitializeResponse {
  status: boolean
  message?: string
  data?: {
    authorization_url?: string
  }
}

interface MetadataComponentProps {
  checkout?: CheckoutInput
}

const exampleCheckout: CheckoutInput = {
  email: 'josephnok088@gmail.com',
  amountGhs: 255,
  customerName: 'Osei Kwaku',
  phone: '+233246304690',
  address: 'AH-0834-8492',
  city: 'Ho',
  region: 'Upper East',
  cart: [
    { name: 'Merch', color: 'red', size: 'M', quantity: 3 },
    { name: 'Merch', color: 'black', size: 'XL', quantity: 1 },
    { name: 'Merch', color: 'blue', size: 'M', quantity: 2 },
  ],
}

function validateCheckoutInput(data: CheckoutInput) {
  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    throw new Error('A valid customer email is required.')
  }

  if (!Number.isFinite(data.amountGhs) || data.amountGhs <= 0) {
    throw new Error('A valid checkout amount is required.')
  }

  if (!data.customerName || !data.phone || !data.address) {
    throw new Error('Customer name, phone number, and address are required.')
  }

  if (!data.city || !data.region) {
    throw new Error('City and region are required.')
  }

  if (!Array.isArray(data.cart) || data.cart.length === 0) {
    throw new Error('The cart must include at least one item.')
  }

  for (const item of data.cart) {
    if (!item.name || !item.size || !Number.isInteger(item.quantity)) {
      throw new Error('Every cart item needs a name, size, and quantity.')
    }

    if (item.quantity <= 0) {
      throw new Error('Cart item quantities must be greater than zero.')
    }
  }
}

function formatCartItemsBreakdown(cart: CartItem[]) {
  if (!cart.length) return 'N/A'

  return cart
    .map((item) => {
      const productName = item.name.trim() || 'Merch'
      const color = item.color?.trim() || 'Color not specified'
      return `${item.quantity}x ${productName} - Color: ${color}, Size: ${item.size.trim()}`
    })
    .join('\n')
}

// ==========================================
// 2. SECURE SERVER FUNCTION WITH MARKDOWN
// ==========================================
export const initializePayment = createServerFn({ method: 'POST' })
  .inputValidator((data: CheckoutInput) => data)
  .handler(async ({ data }) => {
    paystackLog('INIT PAYMENT', 'Function entry', {
      checkoutData: sanitizeForLog({
        email: data.email,
        amountGhs: data.amountGhs,
        customerName: data.customerName,
        phone: data.phone,
        address: data.address,
        city: data.city,
        region: data.region,
        cartItemCount: data.cart.length,
        cart: data.cart,
      }),
    })

    validateCheckoutInput(data)

    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY
    if (!paystackSecretKey) {
      paystackError('INIT PAYMENT', 'PAYSTACK_SECRET_KEY is not configured on the server')
      throw new Error('PAYSTACK_SECRET_KEY is not configured on the server.')
    }

    const markdownAddress = `
### 📍 Shipping Address
* **Street/Digital:** ${data.address}
* **City:** ${data.city}
* **Region:** ${data.region}
* **Country:** Ghana
    `.trim()

    const markdownCartSummary = formatCartItemsBreakdown(data.cart)

    const amountInPesewas = Math.round(data.amountGhs * 100)

    paystackLog('INIT PAYMENT', 'Prepared Paystack initialize payload', {
      email: data.email,
      amountGhs: data.amountGhs,
      amountInPesewas,
      metadata: sanitizeForLog({
        customer_name: data.customerName,
        phone_number: data.phone,
        delivery_info: markdownAddress,
        order_items_breakdown: markdownCartSummary,
      }),
    })

    const response = await fetch(
      'https://api.paystack.co/transaction/initialize',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email,
          amount: amountInPesewas,
          currency: 'GHS',
          metadata: {
            customer_name: data.customerName,
            phone_number: data.phone,
            delivery_info: markdownAddress,
            order_items_breakdown: markdownCartSummary,
            custom_fields: [
              {
                display_name: 'Customer Name',
                variable_name: 'customer_name',
                value: data.customerName,
              },
              {
                display_name: 'Phone Number',
                variable_name: 'phone_number',
                value: data.phone,
              },
              {
                display_name: 'Delivery Info',
                variable_name: 'delivery_info',
                value: markdownAddress,
              },
              {
                display_name: 'Order Items Breakdown',
                variable_name: 'order_items_breakdown',
                value: markdownCartSummary,
              },
            ],
          },
        }),
      },
    )

    const result = (await response.json()) as PaystackInitializeResponse

    paystackLog('INIT PAYMENT', 'Paystack initialize response received', {
      httpStatus: response.status,
      paystackStatus: result.status,
      message: result.message,
      authorizationUrl: result.data?.authorization_url,
      responseBody: sanitizeForLog(result as unknown as Record<string, unknown>),
    })

    if (!response.ok || !result.status || !result.data?.authorization_url) {
      paystackError('INIT PAYMENT', 'Paystack transaction setup failed', {
        httpStatus: response.status,
        message: result.message,
      })
      throw new Error(result.message || 'Paystack transaction setup failed.')
    }

    paystackLog('INIT PAYMENT', 'Payment initialization succeeded', {
      authorizationUrl: result.data.authorization_url,
    })

    return { url: result.data.authorization_url }
  })

// ==========================================
// 3. FRONTEND UI COMPONENT
// ==========================================
export default function MetadataComponent({
  checkout = exampleCheckout,
}: MetadataComponentProps) {
  const initializePaymentFn = useServerFn(initializePayment)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const handlePayment = async () => {
    setIsLoading(true)
    setErrorMessage('')

    paystackLog('MOMO PAYMENT', 'Sending init request from MetadataComponent', {
      checkoutId: checkout.email,
      amountGhs: checkout.amountGhs,
      customerName: checkout.customerName,
    })

    try {
      const redirectData = await initializePaymentFn({
        data: checkout,
      })

      paystackLog('MOMO PAYMENT', 'Init request succeeded', {
        redirectUrl: redirectData.url,
      })

      if (redirectData.url) {
        paystackLog('MOMO PAYMENT', 'Redirecting to Paystack authorization URL', {
          redirectUrl: redirectData.url,
        })
        window.location.href = redirectData.url
      }
    } catch (error) {
      paystackError(
        'MOMO PAYMENT',
        'Paystack checkout initialization failed',
        { amountGhs: checkout.amountGhs },
        error,
      )
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Payment processing failed. Please try again.',
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-start gap-4">
      <button
        type="button"
        onClick={() => void handlePayment()}
        disabled={isLoading}
        className="bg-[#FFBE1A] px-8 py-3 font-bold tracking-wider text-black uppercase transition-all hover:bg-[#f4ae00] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? 'Processing...' : 'Confirm and Pay'}
      </button>

      {errorMessage ? (
        <p className="text-sm font-medium text-red-400">{errorMessage}</p>
      ) : null}
    </div>
  )
}
