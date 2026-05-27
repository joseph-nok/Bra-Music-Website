import { mutation, query } from './_generated/server'
import { v } from 'convex/values'
import type { Id } from './_generated/dataModel'
import type { MutationCtx } from './_generated/server'
import { MAX_CART_QUANTITY, productForSale } from './marketStock'

const productLine = v.union(v.literal('merch'), v.literal('cap'))
const color = v.union(v.literal('Black'), v.literal('White'))
const size = v.union(
  v.literal('M'),
  v.literal('L'),
  v.literal('XL'),
  v.literal('XXL'),
  v.literal('XXXL'),
)

const orderLineValidator = v.object({
  productLine,
  productId: v.id('marketProducts'),
  quantity: v.number(),
  color,
  size,
})

type ProductLine = 'merch' | 'cap'
type ProductColor = 'Black' | 'White'
type ProductSize = 'M' | 'L' | 'XL' | 'XXL' | 'XXXL'

function requireNonEmptyField(label: string, value: string) {
  const trimmed = value.trim()
  if (!trimmed) {
    throw new Error(`${label} cannot be empty.`)
  }
  return trimmed
}

function assertValidPrice(price: number) {
  if (!Number.isFinite(price) || price < 0) {
    throw new Error('price must be a finite number greater than or equal to 0.')
  }
}

function normalizeQuantity(quantity: number) {
  if (!Number.isFinite(quantity)) {
    throw new Error('Quantity must be a finite number.')
  }
  const normalized = Math.floor(quantity)
  if (normalized < 1) {
    throw new Error('Quantity must be at least 1.')
  }
  return normalized
}

async function resolveActiveCart(
  ctx: MutationCtx,
  cartId: Id<'carts'> | undefined,
) {
  if (cartId) {
    const cart = await ctx.db.get(cartId)
    if (cart && cart.status === 'active') {
      return cartId
    }
  }

  return await ctx.db.insert('carts', { status: 'active' })
}

async function findCartItem(
  ctx: MutationCtx,
  cartId: Id<'carts'>,
  productId: Id<'marketProducts'>,
  selectedColor: ProductColor,
  selectedSize: ProductSize,
) {
  return await ctx.db
    .query('cartItems')
    .withIndex('by_cartId_and_marketProductId_and_color_and_size', (q) =>
      q
        .eq('cartId', cartId)
        .eq('marketProductId', productId)
        .eq('color', selectedColor)
        .eq('size', selectedSize),
    )
    .unique()
}

export const listProducts = query({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db.query('marketProducts').order('desc').take(50)
    return products.map(productForSale)
  },
})

export const ensureProductsAvailable = mutation({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db.query('marketProducts').collect()
    let updated = 0
    for (const product of products) {
      if (!product.inStock || product.stockQuantity < 1) {
        await ctx.db.patch(product._id, {
          inStock: true,
          stockQuantity: Math.max(product.stockQuantity, 50),
        })
        updated += 1
      }
    }
    return { updated }
  },
})

export const addProduct = mutation({
  args: {
    productLine,
    name: v.string(),
    category: v.string(),
    description: v.string(),
    image: v.string(),
    currency: v.optional(v.string()),
    price: v.number(),
    stockQuantity: v.number(),
    inStock: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const name = requireNonEmptyField('name', args.name)
    const category = requireNonEmptyField('category', args.category)
    const description = requireNonEmptyField('description', args.description)
    const image = requireNonEmptyField('image', args.image)
    assertValidPrice(args.price)
    const stockQuantity = Math.max(0, Math.floor(args.stockQuantity))
    const currency = (args.currency ?? 'GHS').trim() || 'GHS'

    return await ctx.db.insert('marketProducts', {
      productLine: args.productLine,
      name,
      category,
      description,
      image,
      currency,
      price: args.price,
      inStock: true,
      stockQuantity,
    })
  },
})

export const updateProduct = mutation({
  args: {
    productId: v.id('marketProducts'),
    productLine: v.optional(productLine),
    name: v.optional(v.string()),
    category: v.optional(v.string()),
    description: v.optional(v.string()),
    image: v.optional(v.string()),
    currency: v.optional(v.string()),
    price: v.optional(v.number()),
    stockQuantity: v.optional(v.number()),
    inStock: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId)
    if (!product) throw new Error('Product not found.')

    const patch: {
      productLine?: ProductLine
      name?: string
      category?: string
      description?: string
      image?: string
      currency?: string
      price?: number
      stockQuantity?: number
      inStock?: boolean
    } = {}

    if (args.productLine !== undefined) patch.productLine = args.productLine
    if (args.name !== undefined)
      patch.name = requireNonEmptyField('name', args.name)
    if (args.category !== undefined)
      patch.category = requireNonEmptyField('category', args.category)
    if (args.description !== undefined)
      patch.description = requireNonEmptyField('description', args.description)
    if (args.image !== undefined)
      patch.image = requireNonEmptyField('image', args.image)
    if (args.currency !== undefined) {
      patch.currency = args.currency.trim() || 'GHS'
    }
    if (args.price !== undefined) {
      assertValidPrice(args.price)
      patch.price = args.price
    }
    if (args.stockQuantity !== undefined) {
      patch.stockQuantity = Math.max(0, Math.floor(args.stockQuantity))
    }
    if (args.inStock !== undefined) patch.inStock = args.inStock
    if (Object.keys(patch).length === 0) return args.productId
    patch.inStock = true

    await ctx.db.patch(args.productId, patch)
    return args.productId
  },
})

export const addCartItem = mutation({
  args: {
    cartId: v.optional(v.id('carts')),
    productId: v.id('marketProducts'),
    quantity: v.number(),
    color,
    size,
  },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId)
    if (!product) {
      throw new Error('This product is unavailable.')
    }

    const requestedQuantity = normalizeQuantity(args.quantity)
    const cartId = await resolveActiveCart(ctx, args.cartId)
    const existing = await findCartItem(
      ctx,
      cartId,
      args.productId,
      args.color,
      args.size,
    )
    const nextQuantity = Math.min(
      (existing?.quantity ?? 0) + requestedQuantity,
      MAX_CART_QUANTITY,
    )
    const lineTotal = product.price * nextQuantity
    const item = {
      cartId,
      productLine: product.productLine,
      marketProductId: product._id,
      productName: product.name,
      productImage: product.image,
      currency: product.currency,
      quantity: nextQuantity,
      color: args.color,
      size: args.size,
      unitPrice: product.price,
      lineTotal,
    }

    if (existing) {
      await ctx.db.patch(existing._id, item)
    } else {
      await ctx.db.insert('cartItems', item)
    }

    return {
      cartId,
      item: {
        productLine: product.productLine,
        productId: product._id,
        name: product.name,
        image: product.image,
        currency: product.currency,
        price: product.price,
        quantity: nextQuantity,
        color: args.color,
        size: args.size,
      },
      cappedAtStock:
        nextQuantity < (existing?.quantity ?? 0) + requestedQuantity,
    }
  },
})

export const updateCartItemQuantity = mutation({
  args: {
    cartId: v.id('carts'),
    productId: v.id('marketProducts'),
    color,
    size,
    quantity: v.number(),
  },
  handler: async (ctx, args) => {
    const cart = await ctx.db.get(args.cartId)
    if (!cart || cart.status !== 'active') {
      throw new Error('Cart is not active.')
    }

    const existing = await findCartItem(
      ctx,
      args.cartId,
      args.productId,
      args.color,
      args.size,
    )
    if (!existing) return null

    if (args.quantity <= 0) {
      await ctx.db.delete(existing._id)
      return null
    }

    const product = await ctx.db.get(args.productId)
    if (!product) {
      throw new Error('This product is unavailable.')
    }

    const nextQuantity = Math.min(
      normalizeQuantity(args.quantity),
      MAX_CART_QUANTITY,
    )
    await ctx.db.patch(existing._id, {
      productLine: product.productLine,
      productName: product.name,
      productImage: product.image,
      currency: product.currency,
      quantity: nextQuantity,
      unitPrice: product.price,
      lineTotal: product.price * nextQuantity,
    })

    return {
      quantity: nextQuantity,
      lineTotal: product.price * nextQuantity,
    }
  },
})

export const createOrder = mutation({
  args: {
    customerName: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    items: v.array(orderLineValidator),
    address: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.items.length === 0) {
      throw new Error('Please add at least one item.')
    }

    let totalAmount = 0
    const resolvedItems: Array<{
      line: (typeof args.items)[number]
      productLine: ProductLine
      productName: string
      productImage: string
      currency: string
      unitPrice: number
      lineTotal: number
    }> = []

    for (const item of args.items) {
      const quantity = normalizeQuantity(item.quantity)
      const product = await ctx.db.get(item.productId)
      if (!product || product.productLine !== item.productLine) {
        throw new Error('One of your selected products is unavailable.')
      }

      const lineTotal = product.price * quantity
      totalAmount += lineTotal
      resolvedItems.push({
        line: { ...item, quantity },
        productLine: product.productLine,
        productName: product.name,
        productImage: product.image,
        currency: product.currency,
        unitPrice: product.price,
        lineTotal,
      })
    }

    const orderId = await ctx.db.insert('merchOrders', {
      customerName: args.customerName,
      email: args.email,
      phone: args.phone,
      address: args.address,
      totalAmount,
    })

    for (const item of resolvedItems) {
      await ctx.db.insert('merchOrderItems', {
        orderId,
        productLine: item.productLine,
        marketProductId: item.line.productId,
        productName: item.productName,
        productImage: item.productImage,
        currency: item.currency,
        quantity: item.line.quantity,
        color: item.line.color,
        size: item.line.size,
        unitPrice: item.unitPrice,
        lineTotal: item.lineTotal,
      })

    }

    return orderId
  },
})
