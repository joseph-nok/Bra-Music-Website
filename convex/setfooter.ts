import { query, mutation } from './_generated/server'
import { v } from 'convex/values'


export const getSetFooter = query({
  args: {},
  handler: async (ctx) => {
    const row = await ctx.db.query('setfooter').first()
    if (row) return row
    // Default values – UI will hide empty linksll.
    return {
      whatsapp: '',
      youtube: '',
      instagram: '',
      tiktok: '',
    }
  },
})

export const setSetFooter = mutation({
  args: {
    whatsapp: v.optional(v.string()),
    youtube: v.optional(v.string()),
    instagram: v.optional(v.string()),
    tiktok: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query('setfooter').first()
    if (existing) {
      await ctx.db.patch(existing._id, {
        whatsapp: args.whatsapp,
        youtube: args.youtube,
        instagram: args.instagram,
        tiktok: args.tiktok,
      })
    } else {
      await ctx.db.insert('setfooter', {
        whatsapp: args.whatsapp,
        youtube: args.youtube,
        instagram: args.instagram,
        tiktok: args.tiktok,
      })
    }
  },
})