/**
 * MarketDataContext
 *
 * Lifts all market-level Convex queries to the root layout so the WebSocket
 * subscription is created ONCE and shared across every route. Routes that
 * previously called useQuery themselves now read from this context and get
 * instant, zero-latency data after the first load — no re-fetch on navigation.
 *
 * Usage:
 *   const { products, allColorImages, ... } = useMarketData()
 */
import { createContext, useContext } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { MARKET_PURCHASES_ENABLED } from '../lib/site-flags'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ProductLine = 'merch' | 'cap'

export type Product = {
  _id: string
  productLine: ProductLine
  name: string
  category: string
  description: string
  image: string
  currency: string
  price: number
  inStock: boolean
  stockQuantity: number
}

export type MarketDataContextValue = {
  /** undefined = still loading; [] = loaded but empty */
  products: Product[] | undefined
  /** undefined = still loading */
  allColorImages: Record<string, Record<string, string>> | undefined
  /** Feature-flag settings — undefined while loading */
  isMerchVisible: boolean
  isCapVisible: boolean
  isMarketPurchasesEnabled: boolean
  /** True while ANY of the above queries are still undefined */
  isLoading: boolean
}

// ─── Context ──────────────────────────────────────────────────────────────────

const MarketDataContext = createContext<MarketDataContextValue | null>(null)

// ─── Provider ─────────────────────────────────────────────────────────────────

/**
 * Place this as high as possible in the component tree (inside ConvexProvider
 * but wrapping all routes) so the subscriptions never unmount on navigation.
 */
export function MarketDataProvider({ children }: { children: React.ReactNode }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const convexApi = api as any

  // ── Heavy data queries (single Convex WebSocket subscription each) ──
  const products = useQuery(convexApi.market.listProducts) as
    | Product[]
    | undefined

  const allColorImages = useQuery(api.merch.getAllColorImages) as
    | Record<string, Record<string, string>>
    | undefined

  // ── Feature-flag settings ────────────────────────────────────────────
  const merchLineEnabled = useQuery(api.settings.getSetting, {
    key: 'merchLineEnabled',
  })
  const capLineEnabled = useQuery(api.settings.getSetting, {
    key: 'capLineEnabled',
  })
  const marketPurchasesEnabledSetting = useQuery(api.settings.getSetting, {
    key: 'marketPurchasesEnabled',
  })

  // Resolve booleans: null means the setting doesn't exist → default to true
  const isMerchVisible =
    merchLineEnabled !== null ? (merchLineEnabled as boolean) : true
  const isCapVisible =
    capLineEnabled !== null ? (capLineEnabled as boolean) : true
  const isMarketPurchasesEnabled =
    marketPurchasesEnabledSetting !== null
      ? (marketPurchasesEnabledSetting as boolean)
      : MARKET_PURCHASES_ENABLED

  const isLoading =
    products === undefined ||
    allColorImages === undefined ||
    merchLineEnabled === undefined ||
    capLineEnabled === undefined ||
    marketPurchasesEnabledSetting === undefined

  const value: MarketDataContextValue = {
    products,
    allColorImages,
    isMerchVisible,
    isCapVisible,
    isMarketPurchasesEnabled,
    isLoading,
  }

  return (
    <MarketDataContext.Provider value={value}>
      {children}
    </MarketDataContext.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Consume the shared market data. Throws if used outside <MarketDataProvider>.
 */
export function useMarketData(): MarketDataContextValue {
  const ctx = useContext(MarketDataContext)
  if (!ctx) {
    throw new Error('useMarketData must be used inside <MarketDataProvider>')
  }
  return ctx
}
