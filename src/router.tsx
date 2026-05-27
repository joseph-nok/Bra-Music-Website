import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'
import NotFound from './components/NotFound'
import { queryClient } from './convex-client'
import type { RouterContext } from './routes/__root'

export function getRouter() {
  const router = createTanStackRouter({
    routeTree,
    defaultNotFoundComponent: NotFound,
    scrollRestoration: true,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
    context: {
      queryClient,
    } satisfies RouterContext,
  })

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
