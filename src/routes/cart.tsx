import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useMutation, useQuery } from 'convex/react'
import { useEffect, useMemo, useState } from 'react'
import { api } from '../../convex/_generated/api'
import GhanaPhoneField from '../components/GhanaPhoneField'
import {
  cartTotal,
  clearCartId,
  loadCart,
  loadCartId,
  saveCart,
} from '../lib/cart'
import type { FormEvent } from 'react'
import type { Id } from '../../convex/_generated/dataModel'
import type { CartItem } from '../lib/cart'

export const Route = createFileRoute('/cart')({ component: CartPage })

type CheckoutItem = Pick<
  CartItem,
  'productLine' | 'productId' | 'quantity' | 'color' | 'size'
>

type CheckoutPreview = {
  items: CheckoutItem[]
  shippingAddress: {
    addressLine1: string
    city: string
    country: string
    firstName: string
    lastName: string
    phone: string
    region: string
  }
  totalAmount: number
  paymentMethod: 'MoMo'
  status: string
  currentTime: string
  momoNumber: string
  email: string
}

function itemKey(
  item: Pick<CartItem, 'productLine' | 'productId' | 'color' | 'size'>,
) {
  return `${item.productLine}:${item.productId}-${item.color}-${item.size}`
}

function CartPage() {
  const navigate = useNavigate()
  const convexApi = api as any
  const products = useQuery(convexApi.market.listProducts)
  const startCheckout = useMutation(convexApi.commerce.startCheckout)
  const updateCartItemQuantity = useMutation(
    convexApi.market.updateCartItemQuantity,
  )
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [status, setStatus] = useState('')
  const [statusTone, setStatusTone] = useState<'error' | 'success'>('error')
  const [checkoutPreview, setCheckoutPreview] =
    useState<CheckoutPreview | null>(null)

  useEffect(() => {
    const syncCart = () => setCartItems(loadCart())
    syncCart()
    window.addEventListener('storage', syncCart)
    window.addEventListener('cart-updated', syncCart as EventListener)
    return () => {
      window.removeEventListener('storage', syncCart)
      window.removeEventListener('cart-updated', syncCart as EventListener)
    }
  }, [])

  const total = useMemo(() => cartTotal(cartItems), [cartItems])
  const currency = cartItems[0]?.currency ?? 'GHS'
  const productById = useMemo(() => {
    const map = new Map<string, any>()
    for (const p of products ?? []) {
      map.set(`${p.productLine}:${p._id}`, p)
    }
    return map
  }, [products])

  function updateCart(nextItems: CartItem[]) {
    setCartItems(nextItems)
    saveCart(nextItems)
    setCheckoutPreview(null)
  }

  async function updateItemQuantity(item: CartItem, quantity: number) {
    const nextItems =
      quantity <= 0
        ? cartItems.filter((cartItem) => itemKey(cartItem) !== itemKey(item))
        : cartItems.map((cartItem) =>
            itemKey(cartItem) === itemKey(item)
              ? { ...cartItem, quantity }
              : cartItem,
          )
    updateCart(nextItems)

    const cartId = loadCartId()
    if (!cartId) return

    try {
      await updateCartItemQuantity({
        cartId: cartId as Id<'carts'>,
        productId: item.productId as Id<'marketProducts'>,
        color: item.color,
        size: item.size,
        quantity,
      })
    } catch (error) {
      console.error(error)
      setStatusTone('error')
      setStatus('Could not update the cart in the database.')
    }
  }

  function validateShipping(formData: FormData) {
    const firstName = String(formData.get('firstName') ?? '').trim()
    const lastName = String(formData.get('lastName') ?? '').trim()
    const phone = String(formData.get('phone') ?? '').trim()
    const addressLine1 = String(formData.get('addressLine1') ?? '').trim()
    const region = String(formData.get('region') ?? '').trim()
    const city = String(formData.get('city') ?? '').trim()
    const momo = String(formData.get('momoNumber') ?? '').trim()
    const email = String(formData.get('email') ?? '').trim()
    if (!firstName || !lastName) return 'First and Last name are required.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return 'A valid email is required.'
    if (!/^\d{9}$/.test(phone)) return 'Phone number must be 9 digits.'
    if (!addressLine1 || !region || !city)
      return 'Shipping address fields are required.'
    if (!/^\d{9}$/.test(momo)) return 'MoMo number must be 9 digits.'
    return null
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus('')
    setCheckoutPreview(null)
    if (cartItems.length === 0) {
      setStatusTone('error')
      return setStatus('Your cart is empty.')
    }

    const formData = new FormData(event.currentTarget)
    const validation = validateShipping(formData)
    if (validation) {
      setStatusTone('error')
      return setStatus(validation)
    }

    setCheckoutPreview({
      items: cartItems.map((item) => ({
        productLine: item.productLine,
        productId: item.productId,
        quantity: item.quantity,
        color: item.color,
        size: item.size,
      })),
      shippingAddress: {
        country: 'Ghana',
        firstName: String(formData.get('firstName') ?? '').trim(),
        lastName: String(formData.get('lastName') ?? '').trim(),
        phone: String(formData.get('phone') ?? '').trim(),
        addressLine1: String(formData.get('addressLine1') ?? '').trim(),
        region: String(formData.get('region') ?? '').trim(),
        city: String(formData.get('city') ?? '').trim(),
      },
      totalAmount: total,
      paymentMethod: 'MoMo',
      status: 'Pending confirmation',
      currentTime: new Date().toLocaleString(),
      momoNumber: String(formData.get('momoNumber') ?? '').trim(),
      email: String(formData.get('email') ?? '')
        .trim()
        .toLowerCase(),
    })
  }

  async function handleConfirmCheckout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus('')
    if (!checkoutPreview) {
      setStatusTone('error')
      return setStatus('Please review your payment details again.')
    }

    if (products === undefined) {
      setStatusTone('error')
      return setStatus('Store catalog is still loading. Please wait a moment.')
    }

    try {
      const savedCartId = loadCartId()
      const checkout = await startCheckout({
        cartId: savedCartId ? (savedCartId as Id<'carts'>) : undefined,
        items: checkoutPreview.items.map((item) => ({
          productLine: item.productLine,
          productId: item.productId as Id<'marketProducts'>,
          quantity: item.quantity,
          color: item.color,
          size: item.size,
        })),
        email: checkoutPreview.email,
        momoNumber: checkoutPreview.momoNumber,
        shippingAddress: checkoutPreview.shippingAddress,
      })

      await navigate({
        to: '/momo-payment',
        search: { checkoutId: checkout.checkoutId },
      })

      updateCart([])
      clearCartId()
      setCheckoutPreview(null)
    } catch (error) {
      console.error(error)
      setStatusTone('error')
      const detail =
        error instanceof Error ? error.message : 'Could not start payment.'
      setStatus(
        detail.includes('unavailable')
          ? detail
          : `${detail} Your cart was not cleared—please try again.`,
      )
    }
  }

  return (
    <main className="px-4 pb-20 pt-14">
      <section className="page-wrap">
        <p className="eyebrow mb-3">Shipping address</p>
        <h1 className="font-display text-5xl font-bold tracking-[-0.04em] text-white sm:text-7xl">
          Checkout
        </h1>

        <div className="mt-10 grid gap-6">
          {cartItems.length === 0 ? (
            <article className="editorial-card p-6">
              <p className="text-lg font-semibold text-white">
                Your cart is empty.
              </p>
            </article>
          ) : null}
          {cartItems.map((item) => {
            const product = productById.get(
              `${item.productLine}:${item.productId}`,
            )
            const maxQty = 99
            return (
              <article key={itemKey(item)} className="editorial-card p-6">
                <p className="text-xs uppercase tracking-[0.16em] text-(--color-copy-soft)">
                  Item details
                </p>
                <h2 className="mt-2 font-display text-3xl font-bold text-(--color-primary)">
                  {product?.name ?? item.name}
                </h2>
                <p className="mt-2 text-lg font-semibold text-(--color-primary)">
                  Color: {item.color} / Label size: {item.size}
                </p>
                <div className="mt-3 grid grid-cols-[auto_1fr_auto] items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      void updateItemQuantity(item, item.quantity - 1)
                    }
                    className="h-10 w-10 rounded-lg border border-white/20 text-lg text-white"
                  >
                    -
                  </button>
                  <select
                    className="field-input py-2"
                    value={item.quantity}
                    onChange={(e) =>
                      void updateItemQuantity(item, Number(e.target.value))
                    }
                  >
                    {Array.from({ length: maxQty }, (_, i) => i + 1).map(
                      (q) => (
                        <option
                          className="bg-[#1c1b1b] text-white"
                          key={q}
                          value={q}
                        >
                          Qty {q}
                        </option>
                      ),
                    )}
                  </select>
                  <button
                    type="button"
                    onClick={() =>
                      void updateItemQuantity(
                        item,
                        Math.min(item.quantity + 1, maxQty),
                      )
                    }
                    className="h-10 w-10 rounded-lg border border-white/20 text-lg text-white"
                  >
                    +
                  </button>
                </div>
                <p className="mt-3 text-lg font-bold text-(--color-primary)">
                  {currency} {(item.price * item.quantity).toFixed(2)}
                </p>
              </article>
            )
          })}
        </div>
      </section>

      <section className="page-wrap mt-12">
        <article className="editorial-card p-8">
          <form
            onSubmit={checkoutPreview ? handleConfirmCheckout : handleSubmit}
            className="grid gap-5"
          >
            <p className="eyebrow">Shipping address</p>
            <label className="field-shell">
              <span className="field-label">Country / Region</span>
              <input
                className="field-input"
                value="Ghana"
                readOnly
                name="country"
              />
            </label>
            <div className="grid gap-5 md:grid-cols-2">
              <label className="field-shell">
                <span className="field-label">First Name</span>
                <input className="field-input" name="firstName" required />
              </label>
              <label className="field-shell">
                <span className="field-label">Last Name</span>
                <input className="field-input" name="lastName" required />
              </label>
            </div>
            <GhanaPhoneField
              id="checkout-phone-number"
              label="Enter Phone Number"
              name="phone"
              required
              defaultValue=""
            />
            <label className="field-shell">
              <span className="field-label">Address</span>
              <input
                className="field-input"
                name="addressLine1"
                required
                placeholder="Street, apartment/house/unit, etc"
              />
            </label>
            <div className="grid gap-5 md:grid-cols-2">
              <label className="field-shell">
                <span className="field-label">State/Province/Region</span>
                <select
                  className="field-input"
                  name="region"
                  required
                  defaultValue=""
                >
                  <option value="" disabled>
                    Select region
                  </option>
                  <option value="Greater Accra">Greater Accra</option>
                  <option value="Ashanti">Ashanti</option>
                  <option value="Western">Western</option>
                  <option value="Central">Central</option>
                  <option value="Eastern">Eastern</option>
                  <option value="Volta">Volta</option>
                  <option value="Northern">Northern</option>
                  <option value="Bono">Bono</option>
                  <option value="Upper East">Upper East</option>
                  <option value="Upper West">Upper West</option>
                </select>
              </label>
              <label className="field-shell">
                <span className="field-label">City</span>
                <select
                  className="field-input"
                  name="city"
                  required
                  defaultValue=""
                >
                  <option value="" disabled>
                    Select city
                  </option>
                  <option value="Accra">Accra</option>
                  <option value="Kumasi">Kumasi</option>
                  <option value="Takoradi">Takoradi</option>
                  <option value="Cape Coast">Cape Coast</option>
                  <option value="Tamale">Tamale</option>
                  <option value="Sunyani">Sunyani</option>
                  <option value="Koforidua">Koforidua</option>
                  <option value="Ho">Ho</option>
                  <option value="Bolgatanga">Bolgatanga</option>
                  <option value="Wa">Wa</option>
                </select>
              </label>
            </div>
            <label className="field-shell">
              <span className="field-label">Email</span>
              <input
                className="field-input"
                type="email"
                name="email"
                required
              />
            </label>

            <p className="eyebrow mt-4">Payment Method</p>
            <label className="field-shell">
              <span className="field-label">Method</span>
              <input
                className="field-input"
                name="paymentMethod"
                value="MoMo"
                readOnly
              />
            </label>
            <GhanaPhoneField
              id="mobile-money-phone-number"
              label="Enter Phone Number"
              name="momoNumber"
              required
              defaultValue=""
            />

            <div className="rounded-lg border border-white/10 bg-black/20 p-3 text-sm text-(--color-copy-soft)">
              Tiny cart summary:{' '}
              <span className="font-semibold text-(--color-primary)">
                {currency} {total.toFixed(2)}
              </span>{' '}
              (selected item total = price x quantity)
            </div>
            <div className="rounded-lg border border-white/10 bg-black/20 p-3 text-sm text-(--color-copy-soft)">
              Order total:{' '}
              <span className="font-semibold text-(--color-primary)">
                {currency} {total.toFixed(2)}
              </span>
            </div>

            {checkoutPreview ? (
              <section className="rounded-2xl border border-white/10 bg-black/25 p-5">
                <p className="eyebrow mb-4">Confirm Details</p>

                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Address Details */}
                  <div className="rounded-lg border border-white/10 bg-black/30 p-4">
                    <p className="mb-3 text-xs uppercase tracking-[0.16em] text-(--color-copy-soft)">
                      Enter your details
                    </p>
                    <div className="space-y-2 text-sm text-white">
                      <p>
                        <span className="text-(--color-copy-soft)">Name:</span>{' '}
                        {checkoutPreview.shippingAddress.firstName}{' '}
                        {checkoutPreview.shippingAddress.lastName}
                      </p>
                      <p>
                        <span className="text-(--color-copy-soft)">Phone:</span>{' '}
                        +233 {checkoutPreview.shippingAddress.phone}
                      </p>
                      <p>
                        <span className="text-(--color-copy-soft)">
                          Address:
                        </span>{' '}
                        {checkoutPreview.shippingAddress.addressLine1}
                      </p>
                      <p>
                        <span className="text-(--color-copy-soft)">City:</span>{' '}
                        {checkoutPreview.shippingAddress.city}
                      </p>
                      <p>
                        <span className="text-(--color-copy-soft)">
                          Region:
                        </span>{' '}
                        {checkoutPreview.shippingAddress.region}
                      </p>
                      <p>
                        <span className="text-(--color-copy-soft)">
                          Country:
                        </span>{' '}
                        {checkoutPreview.shippingAddress.country}
                      </p>
                    </div>
                  </div>

                  {/* Payment Details */}
                  <div className="rounded-lg border border-white/10 bg-black/30 p-4">
                    <p className="mb-3 text-xs uppercase tracking-[0.16em] text-(--color-copy-soft)">
                      Payment Details
                    </p>
                    <div className="space-y-2 text-sm text-white">
                      <p>
                        <span className="text-(--color-copy-soft)">
                          Total Amount:
                        </span>{' '}
                        GHS {checkoutPreview.totalAmount.toFixed(2)}
                      </p>
                      <p>
                        <span className="text-(--color-copy-soft)">
                          Payment Method:
                        </span>{' '}
                        {checkoutPreview.paymentMethod}
                      </p>
                      <p>
                        <span className="text-(--color-copy-soft)">
                          MoMo Number:
                        </span>{' '}
                        +233 {checkoutPreview.momoNumber}
                      </p>
                      <p>
                        <span className="text-(--color-copy-soft)">Email:</span>{' '}
                        {checkoutPreview.email}
                      </p>
                      <p>
                        <span className="text-(--color-copy-soft)">
                          Status:
                        </span>{' '}
                        {checkoutPreview.status}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="submit"
                    className="cta-primary justify-center py-4"
                  >
                    Confirm and Pay
                  </button>
                  <button
                    type="button"
                    className="cta-secondary justify-center py-4"
                    onClick={() => setCheckoutPreview(null)}
                  >
                    Edit Details
                  </button>
                </div>
              </section>
            ) : (
              <button
                type="submit"
                className="cta-primary w-full justify-center py-4"
              >
                Review Payment Details
              </button>
            )}

            {status ? (
              <p
                className={`text-sm ${statusTone === 'error' ? 'text-red-400' : 'text-emerald-300'}`}
              >
                {status}
              </p>
            ) : null}
          </form>
        </article>
      </section>
    </main>
  )
}
