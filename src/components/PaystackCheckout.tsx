import { usePaystackPayment } from 'react-paystack'
import { paystackLog } from '../lib/paystack-debug'

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
        paystackLog('MOMO PAYMENT', 'Opening Paystack inline checkout', {
          reference: config.reference,
          checkoutId:
            typeof config.metadata === 'object' &&
            config.metadata !== null &&
            'checkout_id' in config.metadata
              ? String(config.metadata.checkout_id)
              : undefined,
          amountInPesewas: config.amount,
          email: config.email,
        })
        onInitiate()
        setTimeout(() => {
          paystackLog('MOMO PAYMENT', 'Initializing Paystack payment modal', {
            reference: config.reference,
          })
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
