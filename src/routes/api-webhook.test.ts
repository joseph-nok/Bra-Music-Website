import { createHmac } from 'node:crypto'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  checkoutResult: null as unknown,
  resendSend: vi.fn(),
  convexQuery: vi.fn(),
}))

vi.mock('convex/browser', () => ({
  ConvexHttpClient: vi.fn().mockImplementation(() => ({
    query: mocks.convexQuery,
  })),
}))

vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: {
      send: mocks.resendSend,
    },
  })),
}))

const { POST } = await import('../../app/routes/api/webhook')

const secret = 'test-paystack-secret'

function signedRequest(payload: unknown) {
  const rawBody = JSON.stringify(payload)
  const signature = createHmac('sha512', secret).update(rawBody).digest('hex')

  return new Request('https://example.com/api/webhook', {
    method: 'POST',
    body: rawBody,
    headers: {
      'x-paystack-signature': signature,
    },
  })
}

function chargeSuccessPayload(metadata: Record<string, unknown>) {
  return {
    event: 'charge.success',
    data: {
      amount: 42500,
      reference: 'checkout-1_1780165655356',
      customer: {
        email: 'paystack@example.com',
      },
      metadata,
    },
  }
}

const checkoutBase = {
  _id: 'checkout-1',
  email: 'checkout@example.com',
  momoNumber: '246304690',
  paymentReference: 'Purchase for Your Event ministry',
  totalAmount: 425,
  shippingAddress: {
    country: 'Ghana',
    firstName: 'Osei',
    lastName: 'Kwaku',
    phone: '246304690',
    addressLine1: 'AH-0834-8492',
    region: 'Ashanti',
    city: 'Takoradi',
  },
}

describe('Paystack webhook order item fallback', () => {
  beforeEach(() => {
    process.env.PAYSTACK_SECRET_KEY = secret
    process.env.RESEND_API_KEY = 'test-resend-key'
    process.env.CONVEX_URL = 'https://example.convex.cloud'
    mocks.checkoutResult = null
    mocks.resendSend.mockReset()
    mocks.convexQuery.mockReset()
    mocks.convexQuery.mockImplementation(() => mocks.checkoutResult)
  })

  it('falls back to metadata when checkout exists with empty items', async () => {
    mocks.checkoutResult = {
      ...checkoutBase,
      items: [],
    }

    const response = await POST({
      request: signedRequest(
        chargeSuccessPayload({
          checkout_id: 'checkout-1',
          order_items_breakdown: '2x Metadata Shirt - Color: blue, Size: M',
        }),
      ),
    })

    expect(response.status).toBe(200)
    expect(mocks.resendSend).toHaveBeenCalledOnce()
    expect(mocks.resendSend.mock.calls[0][0].html).toContain(
      '2x Metadata Shirt - Color: blue, Size: M',
    )
  })

  it('falls back to metadata when checkout has no items property', async () => {
    mocks.checkoutResult = { ...checkoutBase }

    const response = await POST({
      request: signedRequest(
        chargeSuccessPayload({
          checkout_id: 'checkout-1',
          order_items_breakdown: '1x Missing Items Tee - Color: green, Size: S',
        }),
      ),
    })

    expect(response.status).toBe(200)
    expect(mocks.resendSend.mock.calls[0][0].html).toContain(
      '1x Missing Items Tee - Color: green, Size: S',
    )
  })

  it('uses checkout items when checkout has populated items', async () => {
    mocks.checkoutResult = {
      ...checkoutBase,
      items: [
        {
          productName: 'Convex Shirt',
          quantity: 3,
          color: 'red',
          size: 'XL',
        },
      ],
    }

    const response = await POST({
      request: signedRequest(
        chargeSuccessPayload({
          checkout_id: 'checkout-1',
          order_items_breakdown: 'Metadata fallback should not win',
        }),
      ),
    })

    expect(response.status).toBe(200)
    const html = mocks.resendSend.mock.calls[0][0].html
    expect(html).toContain('3x Convex Shirt - Color: red, Size: XL')
    expect(html).not.toContain('Metadata fallback should not win')
  })

  it('uses direct metadata when no checkout is found', async () => {
    mocks.checkoutResult = null

    const response = await POST({
      request: signedRequest(
        chargeSuccessPayload({
          checkout_id: 'checkout-1',
          order_items_breakdown: '2x Direct Metadata Hoodie - Color: navy, Size: M',
        }),
      ),
    })

    expect(response.status).toBe(200)
    expect(mocks.resendSend.mock.calls[0][0].html).toContain(
      '2x Direct Metadata Hoodie - Color: navy, Size: M',
    )
  })

  it('uses custom field metadata when no checkout is found', async () => {
    mocks.checkoutResult = null

    const response = await POST({
      request: signedRequest(
        chargeSuccessPayload({
          checkout_id: 'checkout-1',
          custom_fields: [
            {
              display_name: 'Order Items Breakdown',
              variable_name: 'order_items_breakdown',
              value: '1x Custom Field Cap - Color: Black, Size: L',
            },
          ],
        }),
      ),
    })

    expect(response.status).toBe(200)
    expect(mocks.resendSend.mock.calls[0][0].html).toContain(
      '1x Custom Field Cap - Color: Black, Size: L',
    )
  })
})
