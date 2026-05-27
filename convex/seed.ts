import { v } from 'convex/values'
import { mutation } from './_generated/server'

export const seedInitialData = mutation({
  args: { force: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const force = args.force ?? false

    // 1. Site Settings
    const hasSettings = (await ctx.db.query('siteSettings').take(1)).length > 0
    if (!hasSettings || force) {
      if (force) {
        const existing = await ctx.db.query('siteSettings').take(50)
        for (const row of existing) await ctx.db.delete(row._id)
      }
      await ctx.db.insert('siteSettings', {
        key: 'marketPurchasesEnabled',
        value: true,
      })
      await ctx.db.insert('siteSettings', {
        key: 'merchLineEnabled',
        value: true,
      })
      await ctx.db.insert('siteSettings', {
        key: 'capLineEnabled',
        value: true,
      })
      await ctx.db.insert('siteSettings', {
        key: 'sender_email',
        value: 'onboarding@resend.dev',
      })
    }

    // 2. Upcoming Event
    const hasUpcoming = (await ctx.db.query('upcomingEvent').take(1)).length > 0
    if (!hasUpcoming || force) {
      if (force) {
        const existing = await ctx.db.query('upcomingEvent').take(50)
        for (const row of existing) await ctx.db.delete(row._id)
      }
      await ctx.db.insert('upcomingEvent', {
        title: 'Atmosphere of Worship 2024',
        dateIso: '2024-12-15T17:00:00Z',
        timeText: '5:00 PM UTC',
        venue: 'Independence Square',
        city: 'Accra',
        town: 'Ghana',
      })
    }

    // 3. Gallery Albums & Images
    const hasGallery = (await ctx.db.query('galleryAibums').take(1)).length > 0
    if (!hasGallery || force) {
      if (force) {
        const existingAlbums = await ctx.db.query('galleryAibums').take(100)
        for (const album of existingAlbums) {
          const images = await ctx.db
            .query('albumImages')
            .withIndex('by_category', (q) => q.eq('category', album.category))
            .collect()
          for (const img of images) await ctx.db.delete(img._id)
          await ctx.db.delete(album._id)
        }
      }

      const albums = [
        {
          category: 'Atmosphere of Worship: Accra Live',
          dateAdded: 'November 12, 2023',
          coverImage:
            'https://lh3.googleusercontent.com/aida-public/AB6AXuALjEFJRItbVnezBhqWVLkbx7pau5cyK0-unUgK7mkOIaYAtZtVXdju9QT8XKwx9tWzhwlNLc5vx29WoUyDgoWrtWoeKNRczqbzuWibWNuo8Taj4wtLtPi6jhI0bcvP1KwsdRHdiD9SBFdU9QPP1YoKliBpZBqyh022gVlNQCrRiF6GNw4JguPmEPrvwXdkBEPRSUjd14xoMthWV5e_vs4s39lm4DjQKhrD4jUm4n3-l4lUPXxDasm_UGEw6BXWgZMf2VYLZgd9MEds',
          images: [
            'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80',
          ],
        },
        {
          category: 'The Recording Sessions',
          dateAdded: 'October 05, 2023',
          coverImage:
            'https://lh3.googleusercontent.com/aida-public/AB6AXuDFhpWKMOBaLZotrNlhgXEcjXydUgWRGuRv6M_QAmRgbcIK3ZZkA-xK_Lf7Ybx9ln7boM0fPJ-ecPMGZbzSD-F6CSN7YelC1EMiLZulurrB2f1SxT3iVnXktfUdIFiOerC9xOWjerVN-Y_kHmipig-R6UHm6CWvfpDCYslW9eBBq2Hhok4jBYsDpiYOW9KC1RuQ9-tLMAWOFF16MIb9Kt4VUaaoK0FatgYyi4CC62ofL6cwu2OD4HpzhcHqeFGpaZn5dfY62w-TvTf4',
          images: [
            'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1514525253344-991c05556277?auto=format&fit=crop&w=1200&q=80',
          ],
        },
        {
          category: 'Youth Outreach Kumasi',
          dateAdded: 'September 20, 2023',
          coverImage:
            'https://lh3.googleusercontent.com/aida-public/AB6AXuCz8rshQ2xS-VOgaJODeILMg3n9yWOAOs61w1CKkxTinnz7VvgyNXYN8H6_VupM-EKMwoEaGrNb4ZR7a5h4MFzFv1ZSAYe2gX_Vw3oQdZYn7HBieZEzzn31qIJqLJheoSTcgAaDYnZZ2MNPDrmr9mVUUw0QKGzjJJo4fO3VfYVl173cBp8W0hYrWswIYpr7w7mc0SSYxvwKl1Lotg_EE3UQLd4kjDakJyVgjckEX8BFuPrdnBU-9yiT1mA2bTvuzvmYovdgrPC1p5h_',
          images: [
            'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1200&q=80',
          ],
        },
      ]

      for (const a of albums) {
        await ctx.db.insert('galleryAibums', {
          category: a.category,
          dateAdded: a.dateAdded,
          coverImage: a.coverImage,
        })
        for (const img of a.images) {
          await ctx.db.insert('albumImages', {
            category: a.category,
            url: img,
          })
        }
      }
    }

    // 4. Market Products
    const hasProducts = (await ctx.db.query('marketProducts').take(1)).length > 0
    if (!hasProducts || force) {
      if (force) {
        const existing = await ctx.db.query('marketProducts').take(100)
        for (const row of existing) await ctx.db.delete(row._id)
      }
      const products = [
        {
          productLine: 'cap' as const,
          name: 'Cap',
          category: 'Headwear',
          description: 'Structured cap with ministry crest—comfortable for travel, events, and stage days.',
          image: 'https://images.unsplash.com/photo-1521369909029-2afed882baee?auto=format&fit=crop&w=1200&q=80',
          currency: 'GHS',
          price: 240.78,
          inStock: true,
          stockQuantity: 50,
        },
        {
          productLine: 'merch' as const,
          name: 'T-shirt',
          category: 'Apparel',
          description: 'Official Baah Prosper Music cotton tee for rehearsals, outreach, and everyday wear.',
          image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=80',
          currency: 'GHS',
          price: 121.56,
          inStock: true,
          stockQuantity: 75,
        },
        {
          productLine: 'merch' as const,
          name: 'Hoodie',
          category: 'Apparel',
          description: 'Comfortable, warm hoodie perfect for ministry events and cold weather outings.',
          image: 'https://images.unsplash.com/photo-1556821552-5ff41b2da8b7?auto=format&fit=crop&w=1200&q=80',
          currency: 'GHS',
          price: 350.00,
          inStock: true,
          stockQuantity: 40,
        },
      ]
      for (const p of products) {
        await ctx.db.insert('marketProducts', p)
      }
    } else {
      const existingProducts = await ctx.db.query('marketProducts').collect()
      for (const product of existingProducts) {
        if (!product.inStock || product.stockQuantity < 1) {
          await ctx.db.patch(product._id, {
            inStock: true,
            stockQuantity: Math.max(product.stockQuantity, 50),
          })
        }
      }
    }

    // 5. Team Members
    const hasTeam = (await ctx.db.query('teamMembers').take(1)).length > 0
    if (!hasTeam || force) {
      if (force) {
        const existing = await ctx.db.query('teamMembers').take(50)
        for (const row of existing) await ctx.db.delete(row._id)
      }
      const members = [
        {
          name: 'Baah Prosper',
          role: 'Founder & Lead Minister',
          image:
            'https://lh3.googleusercontent.com/aida-public/AB6AXuBl3tVaYRfF79OS064zmwGJsfYsaFS1l_KrWokRoR3v5i_XNCkRJ9zFyvuCja9vwT57IR3wyV1_tGEf4Jss8nbAV7UbJSqd6bvY_2DWMUiw2XVTG1_Ok3JFr7TungLe_a3gSOhXdFr-T2LjvqOoT5GFcuvBASjscYGQ3K3Z-9OwaFuHUKJbbeU6hasnvumep95KdXY-sQXHbjS5R4OOyNh_KFHEkWa9djiKfm1aheCXpIsIStz_f6n3AsjD4gdFH9VfRPpRpRusLhrw',
          bio: 'A visionary worship minister shaping a modern gospel sound rooted in testimony and reverence.',
        },
        {
          name: 'Eunice Mensah',
          role: 'Creative Director',
          image:
            'https://lh3.googleusercontent.com/aida-public/AB6AXuC7lw5OluBtx__0-0bndwHB4EL2shn6Yf0z7FFxHkZ7n1iC9Wpwb1aSiFOsLrUy-L7SCim2x3OjpnPKpMnAFe4iK9LQdFEY5FQ0kQXy4s-zuZQBHYy4PTeBpPS-fcyQOimRLCl7z6b9fKBaUEbRMcxcAWhk_1vUFLyJgp82v6ZYdbN6dKVqEtZFk43P2Ms0dELhoBVxY_MJoRnpvy_80C4tP7N9PORYWZWfx74hDWm90x6bE34MFs95WcwwyD80mAtCyuco7P10k9Yr',
          bio: 'She translates ministry into visual atmosphere, from stage treatment to photographic direction.',
          instagram: 'https://instagram.com/eunicemensah',
          twitter: 'https://twitter.com/eunicemensah',
          tiktok: 'https://tiktok.com/@eunicemensah',
        },
        {
          name: 'Samuel Boateng',
          role: 'Music Producer',
          image:
            'https://lh3.googleusercontent.com/aida-public/AB6AXuDWfgKwKn7YdlUp4nyC24ehp7FSEERaOfL5CWvG-G2fsg9FR4hJVlMZdiocBRcCopbSZNK8m0a2hFYgnaAfwS9PymMROoJ7Z9aZ6k4JFYmWDamMZLkVv1PtVjJCuaD_3bLJ5DTBdg3Hp_iCgqHYh0lrZoHNoG3uU2yYkfEwHLo9lVr6w5j5_CmDEMWPBJSTN8EfImVFUjc3ofgqQz1WxIdddj7Jq7I9HlzDu-OdTQBYgPeD0RJlsxBJpJRxA9BI7LnfU4Ssto9Vo63d',
          bio: 'An award-winning producer blending rich choir textures, clean mix engineering, and live dynamics.',
          instagram: 'https://instagram.com/samboateng',
          twitter: 'https://twitter.com/samboateng',
          tiktok: 'https://tiktok.com/@samboateng',
        },
        {
          name: 'Kofi Mensah',
          role: 'Manager',
          image:
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
          bio: 'Overseeing operations and ministry growth with a focus on strategic planning and partnerships.',
          instagram: 'https://instagram.com/kofimensah',
          twitter: 'https://twitter.com/kofimensah',
          tiktok: 'https://tiktok.com/@kofimensah',
        },
        {
          name: 'Abena Osei',
          role: 'Personal Assistant',
          image:
            'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80',
          bio: 'Providing administrative support and coordinating schedules to ensure smooth ministry operations.',
          instagram: 'https://instagram.com/abenaosei',
          twitter: 'https://twitter.com/abenaosei',
          tiktok: 'https://tiktok.com/@abenaosei',
        },
        {
          name: 'David Appiah',
          role: 'Producer',
          image:
            'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80',
          bio: 'Bringing musical visions to life through expert production and sound design.',
          instagram: 'https://instagram.com/davidappiah',
          twitter: 'https://twitter.com/davidappiah',
          tiktok: 'https://tiktok.com/@davidappiah',
        },
      ]
      for (const m of members) {
        await ctx.db.insert('teamMembers', m)
      }
    }
  },
})
