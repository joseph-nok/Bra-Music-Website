/// <reference types="vite/client" />
import { convexTest } from 'convex-test'
import { describe, expect, it } from 'vitest'
import { api } from './_generated/api'
import schema from './schema'

const modules = import.meta.glob('./**/*.ts')

describe('Convex backend integration', () => {
  it('settings get and set', async () => {
    const t = convexTest(schema, modules)
    await t.mutation(api.settings.setSetting, {
      key: 'merchLineEnabled',
      value: true,
    })
    const value = await t.query(api.settings.getSetting, {
      key: 'merchLineEnabled',
    })
    expect(value).toBe(true)
  })

  it('gallery album lifecycle', async () => {
    const t = convexTest(schema, modules)
    await t.mutation(api.gallery.addAlbum, {
      category: 'Worship Night',
      dateAdded: '2026-05-01',
      coverImage: 'https://example.com/cover.jpg',
      images: ['https://example.com/1.jpg', 'https://example.com/2.jpg'],
    })
    const albums = await t.query(api.gallery.getAlbums, {})
    expect(albums).toHaveLength(1)
    expect(albums[0].images).toHaveLength(2)

    await t.mutation(api.gallery.addImageToAlbum, {
      category: 'Worship Night',
      url: 'https://example.com/3.jpg',
    })
    const updated = await t.query(api.gallery.getAlbums, {})
    expect(updated[0].images.length).toBeGreaterThanOrEqual(3)

    await t.mutation(api.gallery.deleteAlbum, { id: albums[0]._id })
    expect(await t.query(api.gallery.getAlbums, {})).toHaveLength(0)
  })

  it('events and upcoming event', async () => {
    const t = convexTest(schema, modules)
    const eventId = await t.mutation(api.events.createEvent, {
      title: 'City Worship',
      place: 'Accra Arena, Accra, Ghana',
      dateIso: '2030-06-01T18:00:00.000Z',
      timeText: '6:00 PM',
      isPublished: true,
    })
    expect(eventId).toBeDefined()

    const published = await t.query(api.events.listEvents, { publishedOnly: true })
    expect(published.some((e) => e.title === 'City Worship')).toBe(true)

    await t.mutation(api.events.updateUpcomingEvent, {
      title: 'Upcoming Special',
      dateIso: '2030-07-01T18:00:00.000Z',
      timeText: '7:00 PM',
      venue: 'National Theatre',
      city: 'Accra',
      town: 'Ghana',
    })
    const upcoming = await t.query(api.events.getUpcomingEvent, {})
    expect(upcoming?.title).toBe('Upcoming Special')
  })

  it('content queries', async () => {
    const t = convexTest(schema, modules)
    await t.mutation(api.music.createTrack, {
      title: 'Test Track',
      lyric: 'Lyric line',
      youtubeUrl: 'https://youtube.com/watch?v=1',
      thumbnailUrl: 'https://example.com/thumb.jpg',
      isFeatured: true,
    })
    const tracks = await t.query(api.music.listTracks, {})
    expect(tracks.length).toBeGreaterThan(0)

    const featured = await t.query(api.content.getFeaturedRelease, {})
    expect(featured?.title).toBe('Test Track')

    await t.mutation(api.team.addMember, {
      name: 'Baah Prosper',
      role: 'Lead',
      image: 'https://example.com/member.jpg',
      bio: 'Bio text',
    })
    const member = await t.query(api.content.getMemberByName, { name: 'Baah Prosper' })
    expect(member?.role).toBe('Lead')
  })

  it('market cart and checkout flow', async () => {
    const t = convexTest(schema, modules)
    const productId = await t.mutation(api.market.addProduct, {
      productLine: 'cap',
      name: 'Ministry Cap',
      category: 'Cap',
      description: 'Embroidered cap',
      image: 'https://example.com/cap.jpg',
      price: 80,
      stockQuantity: 10,
    })

    const products = await t.query(api.market.listProducts, {})
    expect(products.some((p) => p.name === 'Ministry Cap')).toBe(true)

    const cartResult = await t.mutation(api.market.addCartItem, {
      productId,
      quantity: 1,
      color: 'Black',
      size: 'L',
    })
    expect(cartResult.item.quantity).toBe(1)

    const checkout = await t.mutation(api.commerce.startCheckout, {
      cartId: cartResult.cartId,
      items: [
        {
          productLine: 'cap',
          productId,
          quantity: 1,
          color: 'Black',
          size: 'L',
        },
      ],
      email: 'buyer@example.com',
      momoNumber: '0241234567',
      shippingAddress: {
        country: 'Ghana',
        firstName: 'Buyer',
        lastName: 'Test',
        phone: '0241234567',
        addressLine1: '12 High Street',
        region: 'Bono',
        city: 'Sunyani',
      },
    })
    expect(checkout.totalAmount).toBe(80)

    const stored = await t.query(api.commerce.getCheckout, {
      checkoutId: checkout.checkoutId,
    })
    expect(stored?.status).toBe('pending')

    const paid = await t.mutation(api.commerce.completeTestPayment, {
      checkoutId: checkout.checkoutId,
    })
    expect(paid.status).toBe('paid')
  })

  it('invite list and add', async () => {
    const t = convexTest(schema, modules)
    const inviteId = await t.mutation(api.invite.addInvite, {
      name: 'Church Group',
      email: 'church@example.com',
      phone: '+233241234567',
      message: 'Book for Sunday service',
    })
    expect(inviteId).toBeDefined()
    const invites = await t.query(api.invite.listInvites, {})
    expect(invites.some((row) => row.name === 'Church Group')).toBe(true)
  })

  it('setfooter get and set', async () => {
    const t = convexTest(schema, modules)
    await t.mutation(api.setfooter.setSetFooter, {
      whatsapp: 'https://wa.me/233000000000',
      youtube: 'https://youtube.com/test',
    })
    const footer = await t.query(api.setfooter.getSetFooter, {})
    expect(footer.youtube).toBe('https://youtube.com/test')
  })

  it('debug gallery stats', async () => {
    const t = convexTest(schema, modules)
    await t.mutation(api.gallery.addAlbum, {
      category: 'Debug Album',
      dateAdded: '2026-01-01',
      coverImage: 'https://example.com/c.jpg',
      images: [],
    })
    const stats = await t.query(api.debug.checkGalleryData, {})
    expect(stats.albumsCount).toBeGreaterThan(0)
    expect(stats.albums[0].category).toBe('Debug Album')
  })

  it('invite email action returns not configured without API key', async () => {
    const t = convexTest(schema, modules)
    const result = await t.action(api.invite.sendInviteEmail, {
      name: 'Test',
      email: 'test@example.com',
      phone: '+233241234567',
      message: 'Hello',
    })
    expect(result).toEqual({
      success: false,
      error: 'Email service not configured',
    })
  })
})
