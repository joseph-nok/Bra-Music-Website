import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { ConvexProvider } from 'convex/react'
import { convex, queryClient } from '../convex-client'
import Footer from '../components/Footer'
import Header from '../components/Header'

import '../styles.css'

export interface RouterContext {
  queryClient: typeof queryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
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
    // 🛠️ THIS TELLS THE BROWSER TO USE YOUR FAVICON.PNG ASSET DIRECTLY
    links: [
      {
        rel: 'icon',
        type: 'image/png',
        href: '/favicon.png',
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
          <QueryClientProvider client={queryClient}>
            <Header />
            {children}
            <Footer />
          </QueryClientProvider>
        </ConvexProvider>
        <Scripts />
      </body>
    </html>
  )
}
