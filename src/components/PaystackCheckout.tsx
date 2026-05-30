import { usePaystackPayment } from 'react-paystack'

interface PaystackCheckoutProps {
  config: {
    reference?: string
    email?: string
    amount?: number
    [key: string]: unknown
  }
  onSuccess: (response: { reference?: string }) => void
  onClose: () => void
  isPaying: boolean
  isPaid: boolean
  onInitiate: () => void
}

export default function PaystackCheckout({
  config,
  onSuccess,
  onClose,
  isPaying,
  isPaid,
  onInitiate,
}: PaystackCheckoutProps) {
  const initializePayment = usePaystackPayment(config)

  return (
    <button
      type="button"
      disabled={isPaying || isPaid}
      onClick={() => {
        onInitiate()
        setTimeout(() => {
          initializePayment({ onSuccess, onClose })
        }, 100)
      }}
      className="cta-primary w-full justify-center py-4 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {isPaying
        ? 'Processing…'
        : isPaid
          ? 'Already paid'
          : 'Pay with Paystack'}
    </button>
  )
}
