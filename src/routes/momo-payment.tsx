import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery, useAction } from 'convex/react'
import React, { Suspense, useState } from 'react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'

type MomoPaymentSearch = {
  checkoutId: string
}

export const Route = createFileRoute('/momo-payment')({
  validateSearch: (search: Record<string, unknown>): MomoPaymentSearch => ({
    checkoutId:
      typeof search.checkoutId === 'string' ? search.checkoutId.trim() : '',
  }),
  component: MoMoPaymentPage,
})

const PaystackCheckout = React.lazy(() => import('../components/PaystackCheckout'))

type CheckoutItemSummary = {
  productName: string
  quantity: number
  color: string
  size: string
}

function formatOrderItemsBreakdown(items: CheckoutItemSummary[] = []) {
  if (!items.length) return 'N/A'

  return items
    .map((item) => {
      const productName = item.productName.trim() || 'Merch'
      return `${item.quantity}x ${productName} - Color: ${item.color.trim()}, Size: ${item.size.trim()}`
    })
    .join('\n')
}

function MoMoPaymentPage() {
  const navigate = useNavigate()
  const convexApi = api as any
  const { checkoutId } = Route.useSearch()
  const [paymentStep, setPaymentStep] = useState<'review' | 'success'>('review')
  const [isPaying, setIsPaying] = useState(false)

  const checkout = useQuery(
    convexApi.commerce.getCheckout,
    checkoutId
      ? { checkoutId: checkoutId as Id<'checkouts'> }
      : 'skip',
  )
  const verifyPayment = useAction(convexApi.commerce.verifyPaystackPayment)

  if (!checkoutId) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <section className="page-wrap max-w-md">
          <article className="editorial-card p-8 text-center">
            <p className="text-lg font-semibold text-red-400">
              Missing checkout session. Please start again from your cart.
            </p>
            <button
              type="button"
              onClick={() => void navigate({ to: '/cart' })}
              className="cta-primary mt-6 justify-center py-4"
            >
              Return to Cart
            </button>
          </article>
        </section>
      </main>
    )
  }

  if (checkout === undefined) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <section className="page-wrap max-w-md">
          <article className="editorial-card p-8 text-center">
            <LoadingSpinner />
            <p className="mt-6 text-2xl font-bold text-white">Loading payment</p>
            <p className="mt-2 text-sm text-(--color-copy-soft)">
              Retrieving your checkout details…
            </p>
          </article>
        </section>
      </main>
    )
  }

  if (checkout === null) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <section className="page-wrap max-w-md">
          <article className="editorial-card p-8 text-center">
            <p className="text-lg font-semibold text-red-400">
              Checkout not found. It may have expired.
            </p>
            <button
              type="button"
              onClick={() => void navigate({ to: '/cart' })}
              className="cta-primary mt-6 justify-center py-4"
            >
              Return to Cart
            </button>
          </article>
        </section>
      </main>
    )
  }

  const customerName =
    `${checkout.shippingAddress.firstName} ${checkout.shippingAddress.lastName}`.trim()
  const deliveryInfo = [
    customerName,
    checkout.shippingAddress.addressLine1,
    `${checkout.shippingAddress.city}, ${checkout.shippingAddress.region}`,
    checkout.shippingAddress.country,
  ]
    .filter(Boolean)
    .join('\n')
  const orderItemsBreakdown =
    checkout.orderItemsBreakdown || formatOrderItemsBreakdown(checkout.items)
  const phoneNumber = checkout.shippingAddress.phone || checkout.momoNumber

  const paystackConfig = {
    reference: `${checkout._id}_${Date.now()}`,
    email: checkout.email || '',
    amount: Math.round((checkout.totalAmount || 0) * 100),
    publicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
    currency: checkout.currency || 'GHS',
    metadata: {
      checkout_id: checkout._id,
      customer_name: customerName,
      phone_number: phoneNumber,
      delivery_info: deliveryInfo,
      order_items_breakdown: orderItemsBreakdown,
      custom_fields: [
        {
          display_name: 'Customer Name',
          variable_name: 'customer_name',
          value: customerName,
        },
        {
          display_name: 'Phone Number',
          variable_name: 'phone_number',
          value: phoneNumber,
        },
        {
          display_name: 'Delivery Info',
          variable_name: 'delivery_info',
          value: deliveryInfo,
        },
        {
          display_name: 'Order Items Breakdown',
          variable_name: 'order_items_breakdown',
          value: orderItemsBreakdown,
        },
      ],
    },
  }

  const onSuccess = async (response: any) => {
    setIsPaying(true)
    try {
      await verifyPayment({
        reference: response.reference,
        checkoutId: checkout._id,
      })
      setPaymentStep('success')
    } catch (error) {
      console.error(error)
      alert('Payment verification failed. Please contact support.')
    } finally {
      setIsPaying(false)
    }
  }

  const onClose = () => {
    setIsPaying(false)
    console.log('Payment modal closed')
  }

  if (paymentStep === 'success') {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 pb-20 pt-14">
        <section className="page-wrap max-w-lg">
          <article className="editorial-card p-8">
            <SuccessIcon />
            <p className="eyebrow mb-2 text-center">Test payment</p>
            <h1 className="text-center font-display text-3xl font-bold text-white">
              Payment complete
            </h1>
            <p className="mt-3 text-center text-sm text-(--color-copy-soft)">
              Your Paystack payment was successfully processed.
            </p>

            <PaymentSummary checkout={checkout} className="mt-8" />

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => void navigate({ to: '/' })}
                className="cta-primary justify-center py-4"
              >
                Return Home
              </button>
              <button
                type="button"
                onClick={() => void navigate({ to: '/market' })}
                className="cta-secondary justify-center py-4"
              >
                Continue Shopping
              </button>
            </div>
          </article>
        </section>
      </main>
    )
  }

  return (
    <main className="px-4 pb-20 pt-14">
      <section className="page-wrap max-w-lg">
        <p className="eyebrow mb-3">Mobile Money</p>
        <h1 className="font-display text-4xl font-bold tracking-[-0.04em] text-white sm:text-5xl">
          Complete payment
        </h1>
        <p className="mt-3 text-sm text-(--color-copy-soft)">
          Complete your purchase securely via Paystack.
        </p>

        <article className="editorial-card mt-8 p-8">
          <div className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            <span className="font-semibold uppercase tracking-wider">Secure Payment</span>
            <p className="mt-1 text-emerald-100/90">
              You will be redirected to Paystack to complete your payment securely.
            </p>
          </div>

          <PaymentSummary checkout={checkout} />

          <div className="mt-8 space-y-3">
            <Suspense fallback={
              <button disabled className="cta-primary w-full justify-center py-4 disabled:cursor-not-allowed disabled:opacity-50">
                Loading payment...
              </button>
            }>
              <PaystackCheckout
                config={paystackConfig}
                onSuccess={onSuccess}
                onClose={onClose}
                isPaying={isPaying}
                isPaid={checkout.status === 'paid'}
                onInitiate={() => setIsPaying(true)}
              />
            </Suspense>
            <button
              type="button"
              onClick={() => void navigate({ to: '/cart' })}
              className="cta-secondary w-full justify-center py-4"
            >
              Back to cart
            </button>
          </div>
        </article>
      </section>
    </main>
  )
}

function PaymentSummary({
  checkout,
  className = '',
}: {
  checkout: {
    totalAmount: number
    paymentReference: string
    momoNumber: string
    paymentMethod: string
    email: string
    shippingAddress: {
      firstName: string
      lastName: string
      addressLine1: string
      city: string
      region: string
      country: string
    }
  }
  className?: string
}) {
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="rounded-lg border border-white/10 bg-black/30 p-4">
        <p className="mb-3 text-xs uppercase tracking-[0.16em] text-(--color-copy-soft)">
          Amount due
        </p>
        <p className="font-display text-3xl font-bold text-(--color-primary)">
          GHS {checkout.totalAmount.toFixed(2)}
        </p>
      </div>

      <div className="rounded-lg border border-white/10 bg-black/30 p-4">
        <p className="mb-3 text-xs uppercase tracking-[0.16em] text-(--color-copy-soft)">
          Payment details
        </p>
        <div className="space-y-2 text-sm text-white">
          <p>
            <span className="text-(--color-copy-soft)">Reference:</span>{' '}
            {checkout.paymentReference}
          </p>
          <p>
            <span className="text-(--color-copy-soft)">MoMo number:</span> +233{' '}
            {checkout.momoNumber}
          </p>
          <p>
            <span className="text-(--color-copy-soft)">Method:</span>{' '}
            {checkout.paymentMethod}
          </p>
          <p>
            <span className="text-(--color-copy-soft)">Email:</span> {checkout.email}
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-white/10 bg-black/30 p-4">
        <p className="mb-3 text-xs uppercase tracking-[0.16em] text-(--color-copy-soft)">
          Ship to
        </p>
        <div className="space-y-1 text-sm text-white">
          <p>
            {checkout.shippingAddress.firstName}{' '}
            {checkout.shippingAddress.lastName}
          </p>
          <p>{checkout.shippingAddress.addressLine1}</p>
          <p>
            {checkout.shippingAddress.city}, {checkout.shippingAddress.region}
          </p>
          <p>{checkout.shippingAddress.country}</p>
        </div>
      </div>
    </div>
  )
}

function LoadingSpinner() {
  return (
    <div className="flex justify-center">
      <div className="h-16 w-16 animate-spin rounded-full border-4 border-white/20 border-t-(--color-primary)" />
    </div>
  )
}

function SuccessIcon() {
  return (
    <div className="mb-6 flex justify-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20">
        <svg
          className="h-10 w-10 text-emerald-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>
    </div>
  )
}
