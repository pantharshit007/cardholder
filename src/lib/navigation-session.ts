import { NAVIGATION_CONFIG } from '@/constants'
import type { NavigationSession, NavigationSessionValue } from '@/types/router'

/** UI-only cache owned by one router, never shared between SSR requests.
 * Server functions must still authorize every request against the database.
 */
export function createNavigationSession(
  fetchSession: () => Promise<NavigationSessionValue>,
  now: () => number = Date.now,
): NavigationSession {
  let cached: NavigationSessionValue = null
  let expiresAt = 0
  let pending: Promise<NavigationSessionValue> | undefined

  return {
    get() {
      if (cached && now() < expiresAt) return Promise.resolve(cached)
      if (pending) return pending

      const request = fetchSession().then(
        (session) => {
          if (pending === request) {
            cached = session
            expiresAt = now() + NAVIGATION_CONFIG.sessionStaleTimeMs
            pending = undefined
          }
          return session
        },
        (error: unknown) => {
          if (pending === request) pending = undefined
          throw error
        },
      )
      pending = request
      return request
    },
    clear() {
      cached = null
      expiresAt = 0
      pending = undefined
    },
  }
}
