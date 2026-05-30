import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

export const createTrack = mutation({
  args: {
    title: v.string(),
    lyric: v.string(),
    youtubeUrl: v.string(),
    thumbnailUrl: v.string(),
    type: v.optional(v.string()),
    subtitle: v.optional(v.string()),
    isFeatured: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('musicReleases', {
      title: args.title.trim(),
      type: args.type?.trim() || 'Single',
      subtitle: args.subtitle?.trim(),
      lyric: args.lyric.trim(),
      image: args.thumbnailUrl,
      thumbnailUrl: args.thumbnailUrl,
      youtubeUrl: args.youtubeUrl,
      isFeatured: args.isFeatured ?? false,
    })
  },
})

export const listTracks = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query('musicReleases').order('desc').take(100)
  },
})
