import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { useState } from 'react'
import { api } from '../../convex/_generated/api'

export const Route = createFileRoute('/music')({ component: MusicPage })

function MusicPage() {
  const releases = useQuery(api.content.listMusicReleases)
  const musicCards = releases ?? []

  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({})

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <main className="px-4 pb-20 pt-14">
      <section className="page-wrap">
        <div className="section-heading">
          <div>
            <p className="eyebrow mb-3">Spiritual Discography</p>
            <h1 className="font-display text-5xl font-bold tracking-[-0.04em] text-white sm:text-7xl">
              The sacred sounds
            </h1>
          </div>
          <p className="max-w-xl text-base leading-8 text-(--color-copy-soft)">
            Experience a catalog built around testimony, choir movement, and
            atmosphere-rich worship storytelling.
          </p>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-3">
          {musicCards.map((card: any) => (
            <article
              key={card._id ?? card.title}
              className="editorial-card overflow-hidden"
            >
              <div
                className="cursor-pointer overflow-hidden group"
                onClick={() => toggleExpand(card.title)}
              >
                <img
                  src={card.thumbnailUrl}
                  alt={card.title}
                  className="aspect-video w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-6">
                <h3 className="font-display text-2xl font-bold text-(--color-primary)">
                  {card.title}
                </h3>
                <p className="mt-1 text-xs uppercase tracking-[0.24em] text-(--color-copy-soft)">
                  {card.type}
                </p>

                <div
                  className={`overflow-hidden transition-all duration-500 ${expandedIds[card.title] ? 'mt-5 max-h-[300px] opacity-100' : 'max-h-0 opacity-0'}`}
                >
                  <p className="text-sm leading-7 text-(--color-copy-soft) italic">
                    {card.lyric}
                  </p>
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-6">
                  <a
                    href={card.youtubeUrl ?? 'https://youtube.com'}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-bold uppercase tracking-[0.22em] text-(--color-primary) no-underline hover:underline"
                  >
                    Watch On YouTube
                  </a>
                  <button
                    onClick={() => toggleExpand(card.title)}
                    className="text-xs font-bold uppercase tracking-[0.22em] text-(--color-copy-soft) hover:text-white"
                  >
                    {expandedIds[card.title] ? 'Hide Lyrics' : 'View Lyrics'}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
