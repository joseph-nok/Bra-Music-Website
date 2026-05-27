import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import PaystackCheckout from './PaystackCheckout'

const initializePayment = vi.fn()

vi.mock('react-paystack', () => ({
  usePaystackPayment: () => initializePayment,
}))

describe('PaystackCheckout', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders pay button and triggers payment flow', () => {
    vi.useFakeTimers()
    const onInitiate = vi.fn()
    const onSuccess = vi.fn()
    const onClose = vi.fn()

    render(
      <PaystackCheckout
        config={{ reference: 'ref-1' }}
        onSuccess={onSuccess}
        onClose={onClose}
        isPaying={false}
        isPaid={false}
        onInitiate={onInitiate}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /pay with paystack/i }))
    expect(onInitiate).toHaveBeenCalled()
    vi.runAllTimers()
    expect(initializePayment).toHaveBeenCalledWith({ onSuccess, onClose })
    vi.useRealTimers()
  })

  it('disables button while paying', () => {
    render(
      <PaystackCheckout
        config={{}}
        onSuccess={vi.fn()}
        onClose={vi.fn()}
        isPaying
        isPaid={false}
        onInitiate={vi.fn()}
      />,
    )
    expect(screen.getByRole('button', { name: /processing/i })).toBeDisabled()
  })
})
