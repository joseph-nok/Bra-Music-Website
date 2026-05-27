import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import { ConvexProvider } from 'convex/react' // 1. Import the Provider
import { convex } from '../convex-client' // 2. Import your client instance
import Footer from '../components/Footer'
import Header from '../components/Header'

import '../styles.css'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Baah Prosper Music' },
      {
        name: 'description',
        content:
          'Baah Prosper Music official site for ministry updates, music, gallery, and event invitations.',
      },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="font-sans antialiased">
        {/* 3. Wrap the content so every route can access the DB */}
        <ConvexProvider client={convex}>
          <Header />
          {children}
          <Footer />
        </ConvexProvider>
        <Scripts />
      </body>
    </html>
  )
}
