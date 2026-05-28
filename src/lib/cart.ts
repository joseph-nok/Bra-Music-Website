export const CART_STORAGE_KEY = 'bpm_market_cart_v5'
export const CART_ID_STORAGE_KEY = 'bpm_market_convex_cart_id_v1'

export type ProductLine = 'merch' | 'cap'

export type CartItem = {
  productLine: ProductLine
  productId: string
  name: string
  image: string
  currency: string
  price: number
  quantity: number
  color: 'Black' | 'White' | 'black' | 'red' | 'white' | 'yellow' | 'blue'
  size: 'M' | 'L' | 'XL' | 'XXL' | 'XXXL'
}

export function loadCart(): CartItem[] {
  if (typeof window === 'undefined') return []
  const raw = window.localStorage.getItem(CART_STORAGE_KEY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as CartItem[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveCart(items: CartItem[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
  window.dispatchEvent(new CustomEvent('cart-updated'))
}

export function loadCartId() {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(CART_ID_STORAGE_KEY)
}

export function saveCartId(cartId: string) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(CART_ID_STORAGE_KEY, cartId)
}

export function clearCartId() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(CART_ID_STORAGE_KEY)
}

export function cartTotal(items: CartItem[]) {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0)
}
