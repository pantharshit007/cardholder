import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import { NAVIGATION_CONFIG } from '@/constants'
import { createNavigationSession } from '@/lib/navigation-session'
import { fetchSession } from '@/server/session'
import { NotFound } from '@/components/not-found'
import { routeTree } from './routeTree.gen'

export function getRouter() {
  const router = createTanStackRouter({
    routeTree,
    context: { navigationSession: createNavigationSession(fetchSession) },
    scrollRestoration: true,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: NAVIGATION_CONFIG.preloadStaleTimeMs,
    defaultNotFoundComponent: NotFound,
  })

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
