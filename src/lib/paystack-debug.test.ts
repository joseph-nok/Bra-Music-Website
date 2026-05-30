import { describe, expect, it, vi } from 'vitest'
import {
  correlationId,
  PAYSTACK_DEBUG,
  paystackLog,
  sanitizeForLog,
} from './paystack-debug'

describe('paystack-debug', () => {
  it('uses reference as correlation id', () => {
    expect(
      correlationId({
        reference: 'checkout-1_123',
        checkoutId: 'checkout-1',
      }),
    ).toBe('checkout-1_123')
  })

  it('redacts sensitive keys', () => {
    expect(
      sanitizeForLog({
        reference: 'checkout-1_123',
        PAYSTACK_SECRET_KEY: 'sk_test_secret',
        authorization: 'Bearer token',
      }),
    ).toEqual({
      reference: 'checkout-1_123',
      PAYSTACK_SECRET_KEY: '[REDACTED]',
      authorization: '[REDACTED]',
    })
  })

  it('logs when debug is enabled', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})

    paystackLog('INIT PAYMENT', 'Test message', {
      reference: 'checkout-1_123',
    })

    if (PAYSTACK_DEBUG) {
      expect(spy).toHaveBeenCalled()
    }

    spy.mockRestore()
  })
})
