import { v } from 'convex/values'
import { mutation, query } from './_generated/server'

const MAX_ALBUMS = 30
const MAX_IMAGES_PER_ALBUM = 100

export const getAlbums = query({
  args: {},
  handler: async (ctx) => {
    const albums = await ctx.db
      .query('galleryAibums')
      .withIndex('by_dateAdded')
      .order('desc')
      .take(MAX_ALBUMS)

    return await Promise.all(
      albums.map(async (album) => {
        const images = await ctx.db
          .query('albumImages')
          .withIndex('by_category', (q) => q.eq('category', album.category))
          .take(MAX_IMAGES_PER_ALBUM)

        return {
          _id: album._id,
          category: album.category,
          dateAdded: album.dateAdded,
          coverImage: album.coverImage,
          images: images.map((img) => img.url),
        }
      }),
    )
  },
})

export const addAlbum = mutation({
  args: {
    category: v.string(),
    dateAdded: v.string(),
    coverImage: v.string(),
    images: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const albumId = await ctx.db.insert('galleryAibums', {
      category: args.category,
      dateAdded: args.dateAdded,
      coverImage: args.coverImage,
    })

    for (const [index, url] of args.images.entries()) {
      await ctx.db.insert('albumImages', {
        category: args.category,
        url,
        order: index,
      })
    }

    return albumId
  },
})

export const deleteAlbum = mutation({
  args: { id: v.id('galleryAibums') },
  handler: async (ctx, args) => {
    const album = await ctx.db.get(args.id)
    if (album) {
      const images = await ctx.db
        .query('albumImages')
        .withIndex('by_category', (q) => q.eq('category', album.category))
        .take(MAX_IMAGES_PER_ALBUM)

      for (const image of images) {
        await ctx.db.delete(image._id)
      }
      await ctx.db.delete(args.id)
    }
  },
})

export const addImageToAlbum = mutation({
  args: {
    category: v.string(),
    url: v.string(),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert('albumImages', {
      category: args.category,
      url: args.url,
      order: args.order,
    })
  },
})
