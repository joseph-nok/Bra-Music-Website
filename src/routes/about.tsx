import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { convexQuery } from '@convex-dev/react-query'
import { Instagram } from 'lucide-react'
import { api } from '../../convex/_generated/api'
export const Route = createFileRoute('/about')({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(
      convexQuery(api.content.listTeamMembers, {}),
    )
  },
  component: AboutPage,
})

function AboutPage() {
  const { data: teamMembers } = useQuery(
    convexQuery(api.content.listTeamMembers, {}),
  )

  if (!teamMembers) {
    return (
      <main className="px-4 pb-20 pt-14">
        <section className="page-wrap animate-pulse">
          <div className="grid gap-10 lg:grid-cols-[1fr_0.9fr] lg:items-center mb-20">
            <div>
              <div className="h-4 w-32 bg-white/10 rounded-full mb-3" />
              <div className="h-16 w-3/4 bg-white/10 rounded-2xl mb-6" />
              <div className="h-6 w-2/3 bg-white/10 rounded-lg" />
            </div>
            <div className="editorial-card h-[600px] w-full bg-white/3 border border-white/5 rounded-2xl" />
          </div>

          <div className="pt-20">
            <div className="h-4 w-32 bg-white/10 rounded-full mb-3" />
            <div className="h-10 w-1/2 bg-white/10 rounded-xl mb-10" />
            <div className="grid gap-8 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="editorial-card overflow-hidden rounded-2xl border border-white/5 bg-white/2">
                  <div className="h-80 w-full bg-white/10" />
                  <div className="p-7 space-y-4">
                    <div className="h-3 w-1/4 bg-white/10 rounded-full" />
                    <div className="h-6 w-1/2 bg-white/10 rounded-lg" />
                    <div className="space-y-2">
                      <div className="h-4 w-full bg-white/10 rounded-full" />
                      <div className="h-4 w-5/6 bg-white/10 rounded-full" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="px-4 pb-20 pt-14">
      <section className="page-wrap grid gap-10 lg:grid-cols-[1fr_0.9fr] lg:items-center">
        <div>
          <p className="eyebrow mb-3">The Ministry</p>
          <h1 className="font-display text-5xl font-bold leading-tight tracking-[-0.04em] text-white sm:text-7xl">
            Voices of prosperity, faith, and worship.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-(--color-copy-soft)">
            Guided by faith and shaped by Ghanaian gospel tradition, Baah
            Prosper Music exists to create encounters that feel both sacred and
            beautifully produced.
          </p>
        </div>

        <div className="editorial-card overflow-hidden">
          <img
            src="/Angel.png"
            alt="Baah Prosper Music collective"
            className="h-[600px] w-full object-cover"
          />
        </div>
      </section>

      <section className="px-0 pt-20">
        <div className="page-wrap grid gap-8 md:grid-cols-2">
          <article className="editorial-card p-8">
            <p className="eyebrow mb-3">Our Sacred Mission</p>
            <h2 className="font-display text-3xl font-bold text-white">
              Excellence with spiritual integrity
            </h2>
            <p className="mt-4 text-sm leading-7 text-(--color-copy-soft)">
              Every arrangement, rehearsal, and performance is designed to serve
              the message before the moment. The craft matters because the
              calling matters.
            </p>
          </article>
          <article className="editorial-card p-8">
            <p className="eyebrow mb-3">Creative Direction</p>
            <h2 className="font-display text-3xl font-bold text-white">
              Editorial visuals, live atmosphere, and warm sound
            </h2>
            <p className="mt-4 text-sm leading-7 text-(--color-copy-soft)">
              The ministry pairs classic choir gravity with modern production so
              each release and live event feels intentional, premium, and full
              of emotional depth.
            </p>
          </article>
        </div>
      </section>

      <section className="page-wrap pt-20">
        <p className="eyebrow mb-3">Meet The Team</p>
        <h2 className="font-display text-4xl font-bold text-white">
          Dedicated hearts behind the melodies
        </h2>
        <div className="mt-10 grid gap-8 lg:grid-cols-3">
          {teamMembers.map((member: any) => (
            <article
              key={member.name}
              className="editorial-card overflow-hidden"
            >
              <img
                src={member.image}
                alt={member.name}
                className="h-80 w-full object-cover"
              />
              <div className="p-7">
                <p className="eyebrow mb-2">{member.role}</p>
                <h3 className="font-display text-2xl font-bold text-white">
                  {member.name}
                </h3>
                <p className="mt-4 text-sm leading-7 text-(--color-copy-soft)">
                  {member.bio}
                </p>
                {member.role !== 'Founder & Lead Minister' && (
                  <div className="mt-6 flex gap-4">
                    {member.instagram && (
                      <a
                        href={member.instagram}
                        target="_blank"
                        rel="noreferrer"
                        className="text-(--color-copy-soft) transition-colors hover:text-white"
                        aria-label="Instagram"
                      >
                        <Instagram size={18} />
                      </a>
                    )}
                    {member.twitter && (
                      <a
                        href={member.twitter}
                        target="_blank"
                        rel="noreferrer"
                        className="text-(--color-copy-soft) transition-colors hover:text-white"
                        aria-label="X (Twitter)"
                      >
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                      </a>
                    )}
                    {member.tiktok && (
                      <a
                        href={member.tiktok}
                        target="_blank"
                        rel="noreferrer"
                        className="text-(--color-copy-soft) transition-colors hover:text-white"
                        aria-label="TikTok"
                      >
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
                        </svg>
                      </a>
                    )}
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
