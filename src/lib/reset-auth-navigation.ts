import type { getRouter } from '@/router'

/** Discard the previous user's session and route data after an auth transition. */
export async function resetAuthNavigation(
  router: ReturnType<typeof getRouter>,
) {
  router.options.context.navigationSession.clear()
  router.clearCache()
  await router.invalidate()
}
