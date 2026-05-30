import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

/**
 * Generate a short-lived upload URL that the browser can POST a file to.
 * The client uploads the PNG directly to Convex File Storage, then calls
 * saveColorImage with the returned storageId.
 */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl()
  },
})

/**
 * Save (or replace) the color image for a product.
 * If a record already exists for productId+colorName we delete the old
 * storage file and overwrite the row.
 */
export const saveColorImage = mutation({
  args: {
    productId: v.id('marketProducts'),
    colorName: v.string(),
    storageId: v.id('_storage'),
  },
  handler: async (ctx, args) => {
    // Resolve the public URL from storage
    const url = await ctx.storage.getUrl(args.storageId)
    if (!url) throw new Error('Storage file not found after upload.')

    // Check for an existing record for this product+color
    const existing = await ctx.db
      .query('merchColorImages')
      .withIndex('by_product_and_color', (q) =>
        q.eq('productId', args.productId).eq('colorName', args.colorName),
      )
      .unique()

    if (existing) {
      // Delete the old file from storage to avoid orphaned blobs
      await ctx.storage.delete(existing.storageId)
      await ctx.db.replace(existing._id, {
        productId: args.productId,
        colorName: args.colorName,
        storageId: args.storageId,
        url,
      })
    } else {
      await ctx.db.insert('merchColorImages', {
        productId: args.productId,
        colorName: args.colorName,
        storageId: args.storageId,
        url,
      })
    }

    return { url }
  },
})

/**
 * Delete a color image for a product (removes DB row + storage file).
 */
export const deleteColorImage = mutation({
  args: {
    productId: v.id('marketProducts'),
    colorName: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('merchColorImages')
      .withIndex('by_product_and_color', (q) =>
        q.eq('productId', args.productId).eq('colorName', args.colorName),
      )
      .unique()

    if (!existing) return null

    await ctx.storage.delete(existing.storageId)
    await ctx.db.delete(existing._id)
    return { deleted: true }
  },
})

/**
 * Get all color images for a single product.
 * Returns an array of { colorName, url } objects.
 */
export const getColorImages = query({
  args: { productId: v.id('marketProducts') },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query('merchColorImages')
      .withIndex('by_product', (q) => q.eq('productId', args.productId))
      .take(20)

    return rows.map((r) => ({ colorName: r.colorName, url: r.url }))
  },
})

/**
 * Get color images for ALL products at once.
 * Returns a map: { [productId]: { [colorName]: url } }
 * Used on the market page so we can do a single query instead of N queries.
 */
export const getAllColorImages = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query('merchColorImages').take(200)

    const map: Record<string, Record<string, string>> = {}
    for (const row of rows) {
      const pid = row.productId as string
      if (!map[pid]) map[pid] = {}
      map[pid][row.colorName] = row.url
    }
    return map
  },
})
