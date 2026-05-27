import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  CART_ID_STORAGE_KEY,
  CART_STORAGE_KEY,
  cartTotal,
  clearCartId,
  loadCart,
  loadCartId,
  saveCart,
  saveCartId,
  type CartItem,
} from './cart'

const sampleItem: CartItem = {
  productLine: 'merch',
  productId: 'prod-1',
  name: 'Test Tee',
  image: '/tee.png',
  currency: 'GHS',
  price: 50,
  quantity: 2,
  color: 'Black',
  size: 'L',
}

describe('cart storage', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.stubGlobal('window', {
      localStorage,
      dispatchEvent: vi.fn(),
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns empty cart when storage is empty', () => {
    expect(loadCart()).toEqual([])
    expect(loadCartId()).toBeNull()
  })

  it('persists and reloads cart items', () => {
    saveCart([sampleItem])
    expect(loadCart()).toEqual([sampleItem])
    expect(localStorage.getItem(CART_STORAGE_KEY)).toContain('Test Tee')
  })

  it('dispatches cart-updated on save', () => {
    saveCart([sampleItem])
    expect(window.dispatchEvent).toHaveBeenCalled()
  })

  it('returns empty array for invalid json', () => {
    localStorage.setItem(CART_STORAGE_KEY, 'not-json')
    expect(loadCart()).toEqual([])
  })

  it('saves and clears convex cart id', () => {
    saveCartId('cart_123')
    expect(loadCartId()).toBe('cart_123')
    clearCartId()
    expect(loadCartId()).toBeNull()
    expect(localStorage.getItem(CART_ID_STORAGE_KEY)).toBeNull()
  })

  it('computes cart total', () => {
    expect(cartTotal([sampleItem, { ...sampleItem, quantity: 1 }])).toBe(150)
  })
})
