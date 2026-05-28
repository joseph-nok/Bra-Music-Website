import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { convexQuery } from '@convex-dev/react-query'
import { useState } from 'react'
import { api } from '../../convex/_generated/api'
import { X as XIcon } from 'lucide-react'

export const Route = createFileRoute('/gallery')({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(
      convexQuery(api.gallery.getAlbums, {}),
    )
  },
  component: GalleryPage,
})

export type GalleryAlbum = {
  _id: string
  category: string
  dateAdded: string
  coverImage: string
  images: string[]
}

export function GalleryPage() {
  const { data: albums, isPending } = useQuery({
    ...convexQuery(api.gallery.getAlbums, {}),
  })
  const [selectedAlbum, setSelectedAlbum] = useState<GalleryAlbum | null>(null)

  if (isPending || albums === undefined) {
    return (
      <main className="px-4 pb-20 pt-14 min-h-screen">
        <section className="page-wrap animate-pulse">
          <div className="h-4 w-32 bg-white/10 rounded-full mb-3" />
          <div className="h-16 w-3/4 bg-white/10 rounded-2xl mb-6" />
          <div className="h-6 w-2/3 bg-white/10 rounded-lg mb-10" />

          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-12">
            {[1, 2, 3, 4].map((i, index) => (
              <div
                key={i}
                className={`bg-white/2 rounded-3xl border border-white/5 p-1 ${
                  index % 4 === 0
                    ? 'md:col-span-8 h-[320px] md:h-[560px]'
                    : index % 4 === 1
                      ? 'md:col-span-4 h-[320px] md:h-[560px]'
                      : 'md:col-span-6 h-[320px] md:h-[360px]'
                }`}
              >
                <div className="w-full h-full bg-white/10 rounded-2xl" />
              </div>
            ))}
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="px-4 pb-20 pt-14">
      <section className="page-wrap">
        <p className="eyebrow mb-3">Divine Moments Captured</p>
        <h1 className="font-display text-5xl font-bold tracking-[-0.04em] text-white sm:text-7xl">
          Our spiritual journey
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-8 text-(--color-copy-soft)">
          Each moment below represents a chapter of our ministry. Tap a category
          to view the full collection.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-12">
          {albums.map((album, index) => (
            <article
              key={album._id}
              data-testid={`gallery-album-${album._id}`}
              onClick={() => setSelectedAlbum(album)}
              className={`gallery-tile cursor-pointer group ${
                index % 4 === 0
                  ? 'md:col-span-8 h-[320px] md:h-[560px]'
                  : index % 4 === 1
                    ? 'md:col-span-4 h-[320px] md:h-[560px]'
                    : 'md:col-span-6 h-[320px] md:h-[360px]'
              }`}
            >
              <img
                src={album.coverImage}
                alt={album.category}
                className="gallery-image transition-transform duration-700 group-hover:scale-105"
              />
              <div className="gallery-overlay">
                <p className="eyebrow mb-2">{album.dateAdded}</p>
                <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">
                  {album.category}
                </h2>
                <span className="mt-4 inline-flex text-xs font-bold uppercase tracking-widest text-(--color-primary) opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  View Category
                </span>
              </div>
            </article>
          ))}
        </div>

        {albums.length === 0 && (
          <div className="text-center py-40">
            <p className="text-(--color-copy-muted) text-lg italic">
              The gallery is currently being curated. Check back soon for new
              moments.
            </p>
          </div>
        )}
      </section>

      {selectedAlbum ? (
        <div
          data-testid="gallery-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8"
        >
          <div
            className="absolute inset-0 bg-black/90 backdrop-blur-xl"
            onClick={() => setSelectedAlbum(null)}
          />

          <div className="relative z-10 w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 bg-zinc-950 p-6 sm:p-12 shadow-2xl custom-scrollbar">
            <button
              type="button"
              onClick={() => setSelectedAlbum(null)}
              className="touch-target-48 absolute right-6 top-6 text-white/50 hover:text-white transition-colors"
              aria-label="Close album"
            >
              <XIcon size={32} />
            </button>

            <div className="mb-12">
              <p className="eyebrow mb-3">{selectedAlbum.dateAdded}</p>
              <h2 className="font-display text-4xl font-bold text-white mb-4">
                {selectedAlbum.category}
              </h2>
              <div className="h-1 w-20 bg-(--color-primary) rounded-full" />
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="overflow-hidden rounded-2xl border border-white/5 bg-zinc-900 aspect-video group">
                <img
                  src={selectedAlbum.coverImage}
                  alt={selectedAlbum.category}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>

              {selectedAlbum.images.map((imgUrl, idx) => (
                <div
                  key={idx}
                  className="overflow-hidden rounded-2xl border border-white/5 bg-zinc-900 aspect-video group"
                >
                  <img
                    src={imgUrl}
                    alt={`${selectedAlbum.category} - ${idx + 1}`}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
              ))}
            </div>

            {selectedAlbum.images.length === 0 ? (
              <p className="text-(--color-copy-soft) text-center py-20">
                More images coming soon to this category.
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </main>
  )
}
