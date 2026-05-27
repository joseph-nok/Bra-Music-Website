import { Link, createFileRoute } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { CalendarDays, MapPin, Play } from 'lucide-react'
import { useEffect, useState } from 'react'
import { api } from '../../convex/_generated/api'

export const Route = createFileRoute('/')({ component: HomePage })

function getCountdownParts(targetDate: Date, now = new Date()) {
  const remainingMs = Math.max(targetDate.getTime() - now.getTime(), 0)
  const totalSeconds = Math.floor(remainingMs / 1000)

  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const mins = Math.floor((totalSeconds % 3600) / 60)
  const secs = totalSeconds % 60

  return [
    [String(days), 'Days'],
    [String(hours).padStart(2, '0'), 'Hours'],
    [String(mins).padStart(2, '0'), 'Mins'],
    [String(secs).padStart(2, '0'), 'Secs'],
  ] as const
}

function HomePage() {
  const upcomingEvent = useQuery(api.events.getUpcomingEvent)
  const homepageContent = useQuery(api.content.getHomepageContent)

  const targetDate = upcomingEvent
    ? new Date(upcomingEvent.dateIso)
    : new Date()
  const [countdownItems, setCountdownItems] = useState(() =>
    getCountdownParts(targetDate),
  )

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCountdownItems(getCountdownParts(targetDate))
    }, 1000)

    return () => window.clearInterval(timer)
  }, [targetDate.getTime()])

  const eventTitle =
    upcomingEvent?.title ?? homepageContent?.eventTitle ?? 'Songs of Redemption'
  const eventLocation = upcomingEvent
    ? `${upcomingEvent.venue}, ${upcomingEvent.city}, ${upcomingEvent.town}`
    : (homepageContent?.eventLocation ??
      'Temple Of Praise International (The Glory Center), Suyani-Fiapre, Ghana')

  const eventDateText = upcomingEvent
    ? `${new Date(upcomingEvent.dateIso).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })} at ${upcomingEvent.timeText}`
    : (homepageContent?.eventDateText ??
      'Sunday, July 12th, 2026 at 5:00 PM UTC')

  return (
    <main className="homepage">
      <section className="homepage-hero">
        <div className="page-wrap homepage-hero__inner">
          <div className="event-card__content">
            <p className="event-card__eyebrow">Upcoming Event</p>
            <h2 className="event-card__title">{eventTitle}</h2>

            <div className="event-card__countdown">
              {countdownItems.map(([value, label]) => (
                <div key={label} className="event-card__count">
                  <div className="event-card__count-value">{value}</div>
                  <div className="event-card__count-label">{label}</div>
                </div>
              ))}
            </div>

            <div className="event-card__meta">
              <div className="event-card__meta-item">
                <CalendarDays size={15} />
                <span>{eventDateText}</span>
              </div>
              <div className="event-card__meta-item">
                <MapPin size={15} />
                <span>{eventLocation}</span>
              </div>
            </div>

            <Link to="/about" className="event-card__link">
              Read More
            </Link>
          </div>

          <div className="homepage-hero__actions">
            <Link
              to="/music"
              className="homepage-button homepage-button--primary"
            >
              Listen Now
              <Play size={14} fill="currentColor" strokeWidth={2.2} />
            </Link>
            <Link
              to="/invite-us"
              className="homepage-button homepage-button--ghost"
            >
              Invite Us
            </Link>
          </div>
        </div>
      </section>

      <section className="homepage-section px-4">
        <div className="page-wrap">
          <div className="event-card">
            <div className="event-card__image-panel">
              <img
                src={homepageContent?.heroImage ?? '/homepic.jpeg'}
                alt={eventTitle}
                className="event-card__image"
              />
            </div>
            <div className="page-wrap quote-card">
              <div className="quote-card__mark">"</div>
              <blockquote className="quote-card__text">
                {homepageContent?.quoteText ??
                  '"Worship is not a performance; it is a direct conversation between the soul and the Creator."'}
              </blockquote>
              <p className="quote-card__author">
                {homepageContent?.quoteAuthor ?? 'Baah Prosper'}
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
