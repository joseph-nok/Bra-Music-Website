import { v } from 'convex/values'
import { mutation, query } from './_generated/server'

export const getAlbums = query({
  args: {},
  handler: async (ctx) => {
    const albums = await ctx.db.query('galleryAibums').order('desc').collect()

    const albumsWithImages = await Promise.all(
      albums.map(async (album) => {
        const images = await ctx.db
          .query('albumImages')
          .withIndex('by_category', (q) => q.eq('category', album.category))
          .collect()
        return {
          ...album,
          images: images.map((img) => img.url),
        }
      }),
    )

    return albumsWithImages
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
        .collect()

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
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('albumImages', {
      category: args.category,
      url: args.url,
    })
  },
})
