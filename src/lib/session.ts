import { auth } from '@/lib/auth'

/** Approval is maintainer-controlled; never authorize from a cached user flag. */
export function getRequestSession(headers: Headers) {
  return auth.api.getSession({
    headers,
    query: { disableCookieCache: true },
  })
}
