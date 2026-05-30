import { query } from './_generated/server'

export const checkGalleryData = query({
  args: {},
  handler: async (ctx) => {
    const albums = await ctx.db.query('galleryAibums').collect()
    const images = await ctx.db.query('albumImages').collect()
    return {
      albumsCount: albums.length,
      imagesCount: images.length,
      albums: albums.map((a) => ({ id: a._id, category: a.category })),
      imagesSample: images.slice(0, 5),
    }
  },
})
