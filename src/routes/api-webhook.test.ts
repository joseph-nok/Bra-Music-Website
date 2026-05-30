import { createHmac } from 'node:crypto'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  checkoutResult: null as unknown,
  resendSend: vi.fn(),
  convexQuery: vi.fn(),
  verifyMetadata: {} as Record<string, unknown>,
  verifyShouldFail: false,
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

vi.stubGlobal(
  'fetch',
  vi.fn(async (url: string | URL | Request) => {
    const urlString = typeof url === 'string' ? url : url.toString()

    if (!urlString.includes('api.paystack.co/transaction/verify/')) {
      throw new Error(`Unexpected fetch: ${urlString}`)
    }

    if (mocks.verifyShouldFail) {
      return {
        ok: false,
        status: 400,
        json: async () => ({
          status: false,
          message: 'Verification failed',
        }),
      }
    }

    const reference = decodeURIComponent(urlString.split('/').pop() ?? '')

    return {
      ok: true,
      status: 200,
      json: async () => ({
        status: true,
        data: {
          status: 'success',
          reference,
          amount: 42500,
          customer: {
            email: 'paystack@example.com',
          },
          metadata: mocks.verifyMetadata,
        },
      }),
    }
  }),
)

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
  mocks.verifyMetadata = metadata

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
    mocks.verifyMetadata = {}
    mocks.verifyShouldFail = false
    mocks.resendSend.mockReset()
    mocks.convexQuery.mockReset()
    mocks.convexQuery.mockImplementation(() => mocks.checkoutResult)
  })

  it('falls back to verified metadata when checkout exists with empty items', async () => {
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

  it('falls back to verified metadata when checkout has no items property', async () => {
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

  it('uses verified metadata when webhook metadata is stripped', async () => {
    mocks.checkoutResult = {
      ...checkoutBase,
      items: [],
    }
    mocks.verifyMetadata = {
      checkout_id: 'checkout-1',
      order_items_breakdown: '2x Verified Shirt - Color: blue, Size: M',
    }

    const response = await POST({
      request: signedRequest({
        event: 'charge.success',
        data: {
          amount: 42500,
          reference: 'checkout-1_1780165655356',
          customer: {
            email: 'paystack@example.com',
          },
        },
      }),
    })

    expect(response.status).toBe(200)
    expect(mocks.resendSend.mock.calls[0][0].html).toContain(
      '2x Verified Shirt - Color: blue, Size: M',
    )
  })

  it('uses direct verified metadata when no checkout is found', async () => {
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

  it('uses verified custom field metadata when no checkout is found', async () => {
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

  it('falls back to webhook metadata when verify request fails', async () => {
    mocks.checkoutResult = {
      ...checkoutBase,
      items: [],
    }
    mocks.verifyShouldFail = true

    const response = await POST({
      request: signedRequest(
        chargeSuccessPayload({
          checkout_id: 'checkout-1',
          order_items_breakdown: '1x Webhook Fallback Tee - Color: white, Size: L',
        }),
      ),
    })

    expect(response.status).toBe(200)
    expect(mocks.resendSend.mock.calls[0][0].html).toContain(
      '1x Webhook Fallback Tee - Color: white, Size: L',
    )
  })
})
