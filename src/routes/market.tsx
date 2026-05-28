import { Link, createFileRoute } from '@tanstack/react-router'
import { useMutation } from 'convex/react'
import { Check, Minus, Plus, ShoppingCart } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import {
  cartTotal,
  loadCart,
  loadCartId,
  saveCart,
  saveCartId,
} from '../lib/cart'
import type { CartItem, ProductLine } from '../lib/cart'
import { useMarketData } from '../context/MarketDataContext'
import type { Product } from '../context/MarketDataContext'

const DEFAULT_COLORS = ['Black', 'White'] as const
const MAX_CART_QUANTITY = 99

type ProductVariant = {
  color: string
  size: 'M' | 'L' | 'XL' | 'XXL' | 'XXXL'
}

type PersistedCartResult = {
  cartId: string
  item: CartItem
  cappedAtStock: boolean
}

function lineKey(p: { _id: string; productLine: ProductLine }) {
  return `${p.productLine}:${p._id}`
}

const fallbackProducts: Product[] = [
  {
    _id: 'fallback-cap',
    productLine: 'cap',
    name: 'Cap',
    category: 'Cap',
    description:
      'Structured cap with ministry crest—comfortable for travel, events, and stage days.',
    image:
      'https://images.unsplash.com/photo-1521369909029-2afed882baee?auto=format&fit=crop&w=1200&q=80',
    currency: 'GHS',
    price: 240.78,
    inStock: true,
    stockQuantity: 3,
  },
  {
    _id: 'fallback-shirt',
    productLine: 'merch',
    name: 'T-shirt',
    category: 'Apparel',
    description:
      'Official Baah Prosper Music cotton tee for rehearsals, outreach, and everyday wear.',
    image:
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=80',
    currency: 'GHS',
    price: 121.56,
    inStock: true,
    stockQuantity: 3,
  },
]

export const Route = createFileRoute('/market')({ component: MarketPage })

function itemKey(
  item: Pick<CartItem, 'productLine' | 'productId' | 'color' | 'size'>,
) {
  return `${item.productLine}:${item.productId}-${item.color}-${item.size}`
}

/* ── Skeleton shown while Convex subscriptions resolve on first load ───── */
function MarketSkeleton() {
  return (
    <main className="px-0 sm:px-4 pb-20 pt-14">
      <section className="page-wrap px-4 sm:px-0">
        {/* Header skeleton */}
        <div className="h-4 w-36 rounded-md bg-white/5 animate-pulse mb-3" />
        <div className="h-14 w-72 rounded-xl bg-white/5 animate-pulse" />
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <div className="h-11 w-28 rounded-xl bg-white/5 animate-pulse" />
          <div className="h-11 w-40 rounded-xl bg-white/5 animate-pulse" />
          <div className="h-11 w-28 rounded-xl bg-white/5 animate-pulse" />
        </div>

        {/* Product card skeletons */}
        <div className="mt-10 grid gap-3 sm:gap-6 -mx-4 sm:mx-0 grid-cols-1 md:grid-cols-2">
          {[0, 1].map((i) => (
            <article
              key={i}
              className="overflow-hidden rounded-2xl flex flex-col border border-white/5 bg-white/[0.02] backdrop-blur-md"
            >
              {/* Image area */}
              <div
                className="bg-white/5 animate-pulse"
                style={{ aspectRatio: '4/3' }}
              />
              {/* Content area */}
              <div className="p-6 flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div className="flex flex-col gap-2">
                    <div className="h-3 w-20 rounded bg-white/5 animate-pulse" />
                    <div className="h-7 w-44 rounded-lg bg-white/5 animate-pulse" />
                  </div>
                  <div className="h-6 w-16 rounded-full bg-white/5 animate-pulse" />
                </div>
                <div className="h-4 w-full rounded bg-white/5 animate-pulse" />
                <div className="h-4 w-3/4 rounded bg-white/5 animate-pulse" />
                <div className="h-6 w-28 rounded bg-white/5 animate-pulse mt-1" />
                <div className="h-4 w-36 rounded bg-white/5 animate-pulse" />
                {/* Color dots skeleton */}
                <div className="flex gap-3 mt-2">
                  {[0, 1, 2].map((j) => (
                    <div
                      key={j}
                      className="h-8 w-8 rounded-full bg-white/5 animate-pulse"
                    />
                  ))}
                </div>
                {/* Button skeleton */}
                <div className="h-12 w-full rounded-xl bg-white/5 animate-pulse mt-3" />
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}

function MarketPage() {
  // ── Data from the global context (never re-fetches on route changes) ──
  const {
    products,
    allColorImages,
    isMerchVisible,
    isCapVisible,
    isMarketPurchasesEnabled,
    isLoading,
  } = useMarketData()

  const convexApi = api as any
  const addCartItem = useMutation(convexApi.market.addCartItem)
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [qtyMap, setQtyMap] = useState<Record<string, number>>({})
  const [variantMap, setVariantMap] = useState<Record<string, ProductVariant>>(
    {},
  )
  const [blinkMap, setBlinkMap] = useState<Record<string, boolean>>({})
  const [addingMap, setAddingMap] = useState<Record<string, boolean>>({})
  const [status, setStatus] = useState('')
  const [statusTone, setStatusTone] = useState<'error' | 'success'>('error')

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

  const catalogProducts =
    products && products.length > 0 ? products : fallbackProducts
  const productList = catalogProducts.filter((product) => {
    if (product.productLine === 'merch') return isMerchVisible
    if (product.productLine === 'cap') return isCapVisible
    return true
  })

  const cartCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems],
  )
  const total = useMemo(() => cartTotal(cartItems), [cartItems])

  // Show skeleton only on the very first load (context data is undefined)
  if (isLoading) return <MarketSkeleton />

  return (
    <main className="px-0 sm:px-4 pb-20 pt-14">
      <section className="page-wrap px-4 sm:px-0">
        <p className="eyebrow mb-3">Official Merchandise</p>
        <h1 className="font-display text-5xl font-bold tracking-[-0.04em] text-white sm:text-7xl">
          Market
        </h1>
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-(--color-copy-soft)">
            Cart: <span className="font-semibold text-white">{cartCount}</span>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-(--color-copy-soft)">
            Total:{' '}
            <span className="font-semibold text-(--color-primary)">
              GHS {total.toFixed(2)}
            </span>
          </div>
          <Link to="/cart" className="cta-primary">
            Go To Cart
          </Link>
        </div>

        {status ? (
          <p
            className={`mt-6 rounded-xl border px-4 py-3 text-sm leading-6 transition-all duration-300 ${
              statusTone === 'error'
                ? 'border-red-500/20 bg-red-500/5 text-red-400'
                : 'border-emerald-500/20 bg-emerald-500/5 text-emerald-300'
            }`}
          >
            {status}
          </p>
        ) : null}

        <div
          className={`mt-10 grid gap-3 sm:gap-6 -mx-4 sm:mx-0 ${
            productList.length === 1
              ? 'grid-cols-1 max-w-md mx-auto justify-center'
              : 'grid-cols-1 md:grid-cols-2'
          }`}
        >
          {productList.map((product) => {
            if (product.productLine === 'merch') {
              return (
                <MerchProductCard
                  key={lineKey(product)}
                  product={product}
                  isMarketPurchasesEnabled={isMarketPurchasesEnabled}
                  addCartItem={addCartItem}
                  cartItems={cartItems}
                  setCartItems={setCartItems}
                  addingMap={addingMap}
                  setAddingMap={setAddingMap}
                  blinkMap={blinkMap}
                  setBlinkMap={setBlinkMap}
                  setStatus={setStatus}
                  setStatusTone={setStatusTone}
                />
              )
            } else {
              return (
                <StandardProductCard
                  key={lineKey(product)}
                  product={product}
                  allColorImages={allColorImages}
                  isMarketPurchasesEnabled={isMarketPurchasesEnabled}
                  addCartItem={addCartItem}
                  cartItems={cartItems}
                  setCartItems={setCartItems}
                  addingMap={addingMap}
                  setAddingMap={setAddingMap}
                  blinkMap={blinkMap}
                  setBlinkMap={setBlinkMap}
                  setStatus={setStatus}
                  setStatusTone={setStatusTone}
                  qtyMap={qtyMap}
                  setQtyMap={setQtyMap}
                  variantMap={variantMap}
                  setVariantMap={setVariantMap}
                />
              )
            }
          })}
        </div>

        {productList.length === 0 ? (
          <article className="editorial-card mt-10 p-6">
            <p className="font-semibold text-white">
              No products match the current switches.
            </p>
          </article>
        ) : null}
      </section>
    </main>
  )
}

function MerchProductCard({
  product,
  isMarketPurchasesEnabled,
  addCartItem,
  cartItems,
  setCartItems,
  addingMap,
  setAddingMap,
  blinkMap,
  setBlinkMap,
  setStatus,
  setStatusTone,
}: {
  product: Product
  isMarketPurchasesEnabled: boolean
  addCartItem: any
  cartItems: CartItem[]
  setCartItems: (items: CartItem[]) => void
  addingMap: Record<string, boolean>
  setAddingMap: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
  blinkMap: Record<string, boolean>
  setBlinkMap: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
  setStatus: (msg: string) => void
  setStatusTone: (tone: 'error' | 'success') => void
}) {
  const lk = lineKey(product)
  const isFallback = product._id.startsWith('fallback-')
  const canPurchase =
    isMarketPurchasesEnabled &&
    !isFallback &&
    product.inStock &&
    product.stockQuantity > 0

  const colors = ['black', 'red', 'white', 'yellow', 'blue'] as const
  type ColorOption = (typeof colors)[number]

  const [currentColor, setCurrentColor] = useState<ColorOption>('black')
  const [selectedSize, setSelectedSize] = useState<
    'M' | 'L' | 'XL' | 'XXL' | 'XXXL'
  >('M')
  const [quantity, setQuantity] = useState(1)

  const currentIndex = colors.indexOf(currentColor)

  async function handleAddToCart() {
    setStatus('')
    if (!isMarketPurchasesEnabled) {
      setStatusTone('error')
      setStatus('Purchases are not available right now.')
      return
    }
    if (isFallback) {
      setStatusTone('error')
      setStatus('Store catalog is still syncing. Please try again shortly.')
      return
    }
    setAddingMap((prev) => ({ ...prev, [lk]: true }))
    try {
      const cartId = loadCartId()
      const persisted = (await addCartItem({
        cartId: cartId ? (cartId as Id<'carts'>) : undefined,
        productId: product._id as Id<'marketProducts'>,
        quantity,
        color: currentColor,
        size: selectedSize,
      })) as PersistedCartResult
      saveCartId(persisted.cartId)
      const nextItem = persisted.item
      const existing = cartItems.find(
        (item) => itemKey(item) === itemKey(nextItem),
      )
      const nextItems = existing
        ? cartItems.map((item) =>
            itemKey(item) === itemKey(nextItem) ? nextItem : item,
          )
        : [...cartItems, nextItem]
      setCartItems(nextItems)
      saveCart(nextItems)
      setStatusTone('success')
      setStatus(
        persisted.cappedAtStock
          ? `${product.name} is already at available stock in your cart.`
          : `${product.name} was added to your cart and saved in Convex.`,
      )
      setBlinkMap((prev) => ({ ...prev, [lk]: true }))
      window.setTimeout(
        () => setBlinkMap((prev) => ({ ...prev, [lk]: false })),
        900,
      )
    } catch (error) {
      console.error(error)
      setStatusTone('error')
      setStatus('Could not add this item to the database. Please try again.')
    } finally {
      setAddingMap((prev) => ({ ...prev, [lk]: false }))
    }
  }

  return (
    <article className="editorial-card overflow-hidden rounded-2xl flex flex-col h-full border border-white/5 bg-white/[0.02] backdrop-blur-md shadow-2xl transition-all duration-300 hover:border-white/10 hover:shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
      {/* Sliding image carousel — fixed height, flush to card edges */}
      <div
        className="relative overflow-hidden bg-white/5"
        style={{ aspectRatio: '4/3', overflow: 'hidden' }}
      >
        <div
          className="flex transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
          style={{
            width: `${colors.length * 100}%`,
            height: '100%',
            transform: `translateX(-${(currentIndex / colors.length) * 100}%)`,
          }}
        >
          {colors.map((c) => (
            <div
              key={c}
              style={{ width: `${100 / colors.length}%`, height: '100%' }}
            >
              <img
                src={`/merch/${c}.png`}
                alt={`${product.name} – ${c}`}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center top',
                  display: 'block',
                }}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="p-6 flex flex-col flex-grow">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-(--color-copy-muted)">
              {product.category}
            </p>
            <h2 className="mt-1 font-display text-2xl font-bold text-white">
              {product.name}
            </h2>
          </div>
          <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-(--color-copy-soft)">
            {product.productLine}
          </span>
        </div>
        <p className="mt-2 text-sm leading-7 text-(--color-copy-soft)">
          {product.description}
        </p>
        <p className="mt-3 text-lg font-bold text-(--color-primary)">
          GHS {product.price}
        </p>
        <p className="mt-1 text-sm font-semibold text-(--color-copy-soft)">
          Quantity left:{' '}
          <span
            className={
              product.inStock && product.stockQuantity > 10
                ? 'text-emerald-400'
                : product.stockQuantity > 0
                  ? 'text-yellow-400'
                  : 'text-red-400'
            }
          >
            {product.stockQuantity}
          </span>
        </p>

        <div className="mt-4 flex flex-col gap-4 flex-grow">
          {/* Color Selector */}
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.1em] text-(--color-copy-muted) block mb-2">
              Color
            </span>
            <div className="flex flex-wrap items-center gap-3">
              {colors.map((c) => {
                let bgClass = ''
                if (c === 'black') bgClass = 'bg-black border border-white/20'
                else if (c === 'red') bgClass = 'bg-[#a0102f]'
                else if (c === 'white')
                  bgClass = 'bg-white border border-black/20'
                else if (c === 'yellow') bgClass = 'bg-[#f6c33d]'
                else if (c === 'blue') bgClass = 'bg-[#1d4ed8]'
                const isActive = currentColor === c
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCurrentColor(c)}
                    title={`Select ${c}`}
                    className={`relative h-8 w-8 rounded-full transition-all duration-300 hover:scale-110 active:scale-95 flex items-center justify-center ${bgClass} ${
                      isActive
                        ? 'ring-2 ring-(--color-primary) ring-offset-2 ring-offset-[#151515] scale-105'
                        : 'opacity-70 hover:opacity-100'
                    }`}
                  >
                    {isActive && (
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${c === 'white' ? 'bg-black' : 'bg-white'}`}
                      />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Size Selector */}
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.1em] text-(--color-copy-muted) block mb-2">
              Size
            </span>
            <div className="flex flex-wrap gap-2">
              {(['M', 'L', 'XL', 'XXL', 'XXXL'] as const).map((sizeOption) => {
                const isSelected = selectedSize === sizeOption
                return (
                  <button
                    key={sizeOption}
                    type="button"
                    onClick={() => setSelectedSize(sizeOption)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all duration-200 active:scale-95 ${
                      isSelected
                        ? 'bg-(--color-primary) text-(--color-primary-ink) border-(--color-primary)'
                        : 'bg-white/5 text-white border-white/10 hover:bg-white/10'
                    }`}
                  >
                    {sizeOption}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Quantity */}
          <div className="field-shell mt-auto">
            <span className="field-label">Quantity</span>
            <div className="flex items-center justify-between gap-4 py-1">
              <button
                type="button"
                aria-label={`Decrease ${product.name} quantity`}
                onClick={() => setQuantity((prev) => Math.max(prev - 1, 1))}
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 text-white transition-colors hover:bg-white/10 active:scale-95"
              >
                <Minus size={16} strokeWidth={2.5} />
              </button>
              <span className="font-display text-lg font-bold text-white">
                {quantity}
              </span>
              <button
                type="button"
                aria-label={`Increase ${product.name} quantity`}
                onClick={() =>
                  setQuantity((prev) => Math.min(prev + 1, MAX_CART_QUANTITY))
                }
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 text-white transition-colors hover:bg-white/10 active:scale-95"
              >
                <Plus size={16} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleAddToCart}
          disabled={!canPurchase || addingMap[lk]}
          className={`cta-secondary mt-5 w-full justify-center transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50 ${
            blinkMap[lk]
              ? 'animate-cart-blink shadow-[0_0_24px_rgba(246,195,61,0.8)] border-(--color-primary)'
              : ''
          }`}
        >
          {addingMap[lk] ? (
            <>
              <Check size={16} strokeWidth={2.5} />
              Saving
            </>
          ) : canPurchase ? (
            <>
              <ShoppingCart size={16} strokeWidth={2.5} />
              Add To Cart
            </>
          ) : !isMarketPurchasesEnabled ? (
            'Unavailable'
          ) : (
            'Out Of Stock'
          )}
        </button>
      </div>
    </article>
  )
}

function StandardProductCard({
  product,
  allColorImages,
  isMarketPurchasesEnabled,
  addCartItem,
  cartItems,
  setCartItems,
  addingMap,
  setAddingMap,
  blinkMap,
  setBlinkMap,
  setStatus,
  setStatusTone,
  qtyMap,
  setQtyMap,
  variantMap,
  setVariantMap,
}: {
  product: Product
  allColorImages: Record<string, Record<string, string>> | undefined
  isMarketPurchasesEnabled: boolean
  addCartItem: any
  cartItems: CartItem[]
  setCartItems: (items: CartItem[]) => void
  addingMap: Record<string, boolean>
  setAddingMap: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
  blinkMap: Record<string, boolean>
  setBlinkMap: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
  setStatus: (msg: string) => void
  setStatusTone: (tone: 'error' | 'success') => void
  qtyMap: Record<string, number>
  setQtyMap: React.Dispatch<React.SetStateAction<Record<string, number>>>
  variantMap: Record<string, ProductVariant>
  setVariantMap: React.Dispatch<
    React.SetStateAction<Record<string, ProductVariant>>
  >
}) {
  const lk = lineKey(product)
  const isFallback = product._id.startsWith('fallback-')
  const canPurchase =
    isMarketPurchasesEnabled &&
    !isFallback &&
    product.inStock &&
    product.stockQuantity > 0
  const selectedVariant = variantMap[lk] ?? { color: 'Black', size: 'M' }

  const productColorMap = allColorImages?.[product._id] ?? {}
  const colorSpecificUrl = productColorMap[selectedVariant.color]
  const displayImage = colorSpecificUrl ?? product.image

  const uploadedColors = Object.keys(productColorMap)
  const allColorOptions = Array.from(
    new Set([...DEFAULT_COLORS, ...uploadedColors]),
  )

  async function handleAddToCart() {
    setStatus('')
    if (!isMarketPurchasesEnabled) {
      setStatusTone('error')
      setStatus('Purchases are not available right now.')
      return
    }
    if (isFallback) {
      setStatusTone('error')
      setStatus('Store catalog is still syncing. Please try again shortly.')
      return
    }
    const quantity = qtyMap[lk] ?? 1
    setAddingMap((prev) => ({ ...prev, [lk]: true }))
    try {
      const cartId = loadCartId()
      const persisted = (await addCartItem({
        cartId: cartId ? (cartId as Id<'carts'>) : undefined,
        productId: product._id as Id<'marketProducts'>,
        quantity,
        color: selectedVariant.color,
        size: selectedVariant.size,
      })) as PersistedCartResult
      saveCartId(persisted.cartId)
      const nextItem = persisted.item
      const existing = cartItems.find(
        (item) => itemKey(item) === itemKey(nextItem),
      )
      const nextItems = existing
        ? cartItems.map((item) =>
            itemKey(item) === itemKey(nextItem) ? nextItem : item,
          )
        : [...cartItems, nextItem]
      setCartItems(nextItems)
      saveCart(nextItems)
      setStatusTone('success')
      setStatus(
        persisted.cappedAtStock
          ? `${product.name} is already at available stock in your cart.`
          : `${product.name} was added to your cart and saved in Convex.`,
      )
      setBlinkMap((prev) => ({ ...prev, [lk]: true }))
      window.setTimeout(
        () => setBlinkMap((prev) => ({ ...prev, [lk]: false })),
        900,
      )
    } catch (error) {
      console.error(error)
      setStatusTone('error')
      setStatus('Could not add this item to the database. Please try again.')
    } finally {
      setAddingMap((prev) => ({ ...prev, [lk]: false }))
    }
  }

  return (
    <article className="editorial-card overflow-hidden rounded-2xl flex flex-col h-full border border-white/5 bg-white/[0.02] backdrop-blur-md shadow-2xl transition-all duration-300 hover:border-white/10 hover:shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
      <div style={{ aspectRatio: '4/3', overflow: 'hidden' }}>
        <img
          key={displayImage}
          src={displayImage}
          alt={`${product.name} – ${selectedVariant.color}`}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center top',
            display: 'block',
            transition: 'transform 0.5s',
          }}
          className="hover:scale-105"
        />
      </div>
      <div className="p-6 flex flex-col flex-grow">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-(--color-copy-muted)">
              {product.category}
            </p>
            <h2 className="mt-1 font-display text-2xl font-bold text-white">
              {product.name}
            </h2>
          </div>
          <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-(--color-copy-soft)">
            {product.productLine}
          </span>
        </div>
        <p className="mt-2 text-sm leading-7 text-(--color-copy-soft)">
          {product.description}
        </p>
        <p className="mt-3 text-lg font-bold text-(--color-primary)">
          GHS {product.price}
        </p>
        <p className="mt-1 text-sm font-semibold text-(--color-copy-soft)">
          Quantity left:{' '}
          <span
            className={
              product.inStock && product.stockQuantity > 10
                ? 'text-emerald-400'
                : product.stockQuantity > 0
                  ? 'text-yellow-400'
                  : 'text-red-400'
            }
          >
            {product.stockQuantity}
          </span>
        </p>
        <div className="mt-4 flex flex-col gap-4 flex-grow">
          <label className="field-shell">
            <span className="field-label">Color</span>
            <select
              className="field-input py-2"
              value={selectedVariant.color}
              onChange={(e) =>
                setVariantMap((prev) => ({
                  ...prev,
                  [lk]: {
                    ...selectedVariant,
                    color: e.target.value as ProductVariant['color'],
                  },
                }))
              }
            >
              {allColorOptions.map((c) => (
                <option key={c} className="bg-[#1c1b1b] text-white" value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="field-shell">
            <span className="field-label">Size (GH)</span>
            <select
              className="field-input py-2"
              value={selectedVariant.size}
              onChange={(e) =>
                setVariantMap((prev) => ({
                  ...prev,
                  [lk]: {
                    ...selectedVariant,
                    size: e.target.value as ProductVariant['size'],
                  },
                }))
              }
            >
              {['M', 'L', 'XL', 'XXL', 'XXXL'].map((sizeOption) => (
                <option
                  className="bg-[#1c1b1b] text-white"
                  key={sizeOption}
                  value={sizeOption}
                >
                  {sizeOption}
                </option>
              ))}
            </select>
          </label>
          <div className="field-shell mt-auto">
            <span className="field-label">Quantity</span>
            <div className="flex items-center justify-between gap-4 py-1">
              <button
                type="button"
                aria-label={`Decrease ${product.name} quantity`}
                onClick={() =>
                  setQtyMap((prev) => ({
                    ...prev,
                    [lk]: Math.max((prev[lk] ?? 1) - 1, 1),
                  }))
                }
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 text-white transition-colors hover:bg-white/10 active:scale-95"
              >
                <Minus size={16} strokeWidth={2.5} />
              </button>
              <span className="font-display text-lg font-bold text-white">
                {qtyMap[lk] ?? 1}
              </span>
              <button
                type="button"
                aria-label={`Increase ${product.name} quantity`}
                onClick={() =>
                  setQtyMap((prev) => ({
                    ...prev,
                    [lk]: Math.min((prev[lk] ?? 1) + 1, MAX_CART_QUANTITY),
                  }))
                }
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 text-white transition-colors hover:bg-white/10 active:scale-95"
              >
                <Plus size={16} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={!canPurchase || addingMap[lk]}
          className={`cta-secondary mt-5 w-full justify-center transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50 ${
            blinkMap[lk]
              ? 'animate-cart-blink shadow-[0_0_24px_rgba(246,195,61,0.8)] border-(--color-primary)'
              : ''
          }`}
        >
          {addingMap[lk] ? (
            <>
              <Check size={16} strokeWidth={2.5} />
              Saving
            </>
          ) : canPurchase ? (
            <>
              <ShoppingCart size={16} strokeWidth={2.5} />
              Add To Cart
            </>
          ) : !isMarketPurchasesEnabled ? (
            'Unavailable'
          ) : (
            'Out Of Stock'
          )}
        </button>
      </div>
    </article>
  )
}
