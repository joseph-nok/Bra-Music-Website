import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

export const createEvent = mutation({
  args: {
    title: v.string(),
    place: v.string(),
    dateIso: v.string(),
    timeText: v.string(),
    isPublished: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('events', {
      title: args.title.trim(),
      place: args.place.trim(),
      dateIso: args.dateIso,
      timeText: args.timeText.trim(),
      isPublished: args.isPublished ?? true,
    })
  },
})

export const listEvents = query({
  args: { publishedOnly: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    if (args.publishedOnly ?? true) {
      return await ctx.db
        .query('events')
        .withIndex('by_isPublished', (q) => q.eq('isPublished', true))
        .take(50)
    }
    return await ctx.db.query('events').order('desc').take(50)
  },
})

export const getNextPublishedEvent = query({
  args: {},
  handler: async (ctx) => {
    const nowIso = new Date().toISOString()
    const events = await ctx.db
      .query('events')
      .withIndex('by_dateIso')
      .order('asc')
      .take(200)
    for (const event of events) {
      if (event.isPublished && event.dateIso >= nowIso) return event
    }
    return null
  },
})
export const getUpcomingEvent = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query('upcomingEvent').unique()
  },
})

export const updateUpcomingEvent = mutation({
  args: {
    title: v.string(),
    dateIso: v.string(),
    timeText: v.string(),
    venue: v.string(),
    city: v.string(),
    town: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query('upcomingEvent').unique()
    if (existing) {
      await ctx.db.patch(existing._id, args)
      return existing._id
    } else {
      return await ctx.db.insert('upcomingEvent', args)
    }
  },
})

export const syncUpcomingEvent = mutation({
  args: {},
  handler: async (ctx) => {
    const nowIso = new Date().toISOString()
    const nextEvent = await ctx.db
      .query('events')
      .withIndex('by_dateIso')
      .order('asc')
      .filter((q) =>
        q.and(
          q.eq(q.field('isPublished'), true),
          q.gte(q.field('dateIso'), nowIso),
        ),
      )
      .first()

    if (!nextEvent) {
      console.log("No upcoming published events found in 'events' table.")
      return null
    }

    // Attempt to parse 'place' into venue, city, town
    const parts = nextEvent.place?.split(',').map((s) => s.trim()) || []
    const venue = parts[0] || 'Unknown Venue'
    const city = parts[1] || 'Unknown City'
    const town = parts[2] || 'Unknown Town'

    const upcomingData = {
      title: nextEvent.title,
      dateIso: nextEvent.dateIso,
      timeText: nextEvent.timeText,
      venue,
      city,
      town,
    }

    const existing = await ctx.db.query('upcomingEvent').unique()
    if (existing) {
      await ctx.db.patch(existing._id, upcomingData)
      return existing._id
    } else {
      return await ctx.db.insert('upcomingEvent', upcomingData)
    }
  },
})
