import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  siteSettings: defineTable({
    key: v.string(),
    value: v.any(),
  }).index('by_key', ['key']),

  invites: defineTable({
    name: v.string(),
    email: v.string(),
    phone: v.string(),
    message: v.string(),
  }),

  upcomingEvent: defineTable({
    title: v.string(),
    dateIso: v.string(),
    timeText: v.string(),
    venue: v.string(),
    city: v.string(),
    town: v.string(),
  }),

  events: defineTable({
    title: v.string(),
    dateIso: v.string(),
    timeText: v.string(),
    venue: v.optional(v.string()),
    city: v.optional(v.string()),
    town: v.optional(v.string()),
    place: v.optional(v.string()),
    isPublished: v.boolean(),
  })
    .index('by_isPublished', ['isPublished'])
    .index('by_dateIso', ['dateIso']),

  galleryAibums: defineTable({
    category: v.string(), // Renamed from title
    dateAdded: v.string(),
    coverImage: v.string(),
  }).index('by_dateAdded', ['dateAdded']),

  albumImages: defineTable({
    category: v.string(), // Link by category name
    url: v.string(),
    order: v.optional(v.number()),
  }).index('by_category', ['category']),

  teamMembers: defineTable({
    name: v.string(),
    role: v.string(),
    image: v.string(),
    bio: v.string(),
    instagram: v.optional(v.string()),
    twitter: v.optional(v.string()),
    tiktok: v.optional(v.string()),
  }),

  musicReleases: defineTable({
    title: v.string(),
    type: v.string(),
    subtitle: v.optional(v.string()),
    lyric: v.string(),
    image: v.optional(v.string()),
    thumbnailUrl: v.string(),
    youtubeUrl: v.string(),
    isFeatured: v.optional(v.boolean()),
    showOnTop: v.optional(v.boolean()),
  }).index('by_showOnTop', ['showOnTop']),

  marketProducts: defineTable({
    productLine: v.union(v.literal('merch'), v.literal('cap')),
    name: v.string(),
    category: v.string(),
    description: v.string(),
    image: v.string(),
    currency: v.optional(v.string()),
    inStock: v.boolean(),
    price: v.number(),
    stockQuantity: v.number(),
  })
    .index('by_productLine_and_name', ['productLine', 'name'])
    .index('by_inStock', ['inStock'])
    .index('by_productLine', ['productLine']),

  carts: defineTable({
    status: v.union(v.literal('active'), v.literal('converted')),
  }),

  cartItems: defineTable({
    cartId: v.id('carts'),
    productLine: v.union(v.literal('merch'), v.literal('cap')),
    marketProductId: v.id('marketProducts'),
    productName: v.string(),
    productImage: v.string(),
    currency: v.string(),
    quantity: v.number(),
    color: v.union(v.literal('Black'), v.literal('White')),
    size: v.union(
      v.literal('M'),
      v.literal('L'),
      v.literal('XL'),
      v.literal('XXL'),
      v.literal('XXXL'),
    ),
    unitPrice: v.number(),
    lineTotal: v.number(),
  })
    .index('by_cartId_and_marketProductId_and_color_and_size', [
      'cartId',
      'marketProductId',
      'color',
      'size',
    ])
    .index('by_cartId', ['cartId']),

  checkouts: defineTable({
    cartId: v.optional(v.id('carts')),
    eventId: v.optional(v.id('events')),
    status: v.string(),
    paymentMethod: v.string(),
    paymentReference: v.string(),
    email: v.string(),
    momoNumber: v.string(),
    currency: v.string(),
    totalAmount: v.number(),
    shippingAddress: v.object({
      country: v.string(),
      firstName: v.string(),
      lastName: v.string(),
      phone: v.string(),
      addressLine1: v.string(),
      region: v.string(),
      city: v.string(),
    }),
  }),

  checkoutItems: defineTable({
    checkoutId: v.id('checkouts'),
    productLine: v.union(v.literal('merch'), v.literal('cap')),
    marketProductId: v.id('marketProducts'),
    productName: v.string(),
    productImage: v.string(),
    currency: v.string(),
    quantity: v.number(),
    color: v.union(v.literal('Black'), v.literal('White')),
    size: v.union(
      v.literal('M'),
      v.literal('L'),
      v.literal('XL'),
      v.literal('XXL'),
      v.literal('XXXL'),
    ),
    unitPrice: v.number(),
    lineTotal: v.number(),
  }).index('by_checkoutId', ['checkoutId']),
})
