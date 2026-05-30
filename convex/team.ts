import { v } from 'convex/values'
import { mutation } from './_generated/server'

export const addMember = mutation({
  args: {
    name: v.string(),
    role: v.string(),
    image: v.string(),
    bio: v.string(),
    instagram: v.optional(v.string()),
    twitter: v.optional(v.string()),
    tiktok: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('teamMembers', {
      name: args.name,
      role: args.role,
      image: args.image,
      bio: args.bio,
      instagram: args.instagram,
      twitter: args.twitter,
      tiktok: args.tiktok,
    })
  },
})

export const updateMember = mutation({
  args: {
    id: v.id('teamMembers'),
    name: v.string(),
    role: v.string(),
    image: v.string(),
    bio: v.string(),
    instagram: v.optional(v.string()),
    twitter: v.optional(v.string()),
    tiktok: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      name: args.name,
      role: args.role,
      image: args.image,
      bio: args.bio,
      instagram: args.instagram,
      twitter: args.twitter,
      tiktok: args.tiktok,
    })
  },
})

export const deleteMember = mutation({
  args: { id: v.id('teamMembers') },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id)
  },
})
