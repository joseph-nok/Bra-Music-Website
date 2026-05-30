import { describe, expect, it } from 'vitest'
import { MAX_CART_QUANTITY, productForSale } from './marketStock'

describe('marketStock', () => {
  it('exports max cart quantity', () => {
    expect(MAX_CART_QUANTITY).toBe(99)
  })

  it('returns product unchanged from productForSale', () => {
    const product = {
      inStock: true,
      stockQuantity: 12,
      name: 'Cap',
    }
    expect(productForSale(product)).toBe(product)
  })
})
