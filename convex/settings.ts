import { query, mutation } from './_generated/server'
import { v } from 'convex/values'

export const getSetting = query({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    const setting = await ctx.db
      .query('siteSettings')
      .withIndex('by_key', (q) => q.eq('key', args.key))
      .unique()
    return setting?.value ?? null
  },
})

export const setSetting = mutation({
  args: { key: v.string(), value: v.any() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('siteSettings')
      .withIndex('by_key', (q) => q.eq('key', args.key))
      .unique()
    if (existing) {
      await ctx.db.patch(existing._id, { value: args.value })
    } else {
      await ctx.db.insert('siteSettings', { key: args.key, value: args.value })
    }
  },
})
