import { betterAuth } from 'better-auth'
import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import { tanstackStartCookies } from 'better-auth/tanstack-start'

import {
  APP_NAME,
  AUTH_PASSWORD_MAX_LENGTH,
  AUTH_PASSWORD_MIN_LENGTH,
  SESSION_COOKIE_CACHE_MAX_AGE_SECONDS,
} from '@/constants'
import { db } from '@/db'
import * as schema from '@/db/schema'
import { env } from '@/env'

function getTrustedOrigins(request?: Request): string[] {
  const origins = new Set<string>()

  if (env.BETTER_AUTH_URL) {
    origins.add(env.BETTER_AUTH_URL)
  }

  const origin = request?.headers.get('origin')
  const host = request?.headers.get('host')

  if (origin) {
    try {
      const url = new URL(origin)
      if (
        (host && url.host === host) ||
        url.hostname === 'localhost' ||
        url.hostname === '127.0.0.1' ||
        url.hostname.endsWith('.ts.net') ||
        url.hostname.startsWith('100.') ||
        url.hostname === 'my-dabba'
      ) {
        origins.add(origin)
      }
    } catch {
      // Ignore malformed origin
    }
  }

  return Array.from(origins)
}

export const auth = betterAuth({
  appName: APP_NAME,
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  trustedOrigins: getTrustedOrigins,
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema,
  }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: !env.ALLOW_SIGNUP,
    minPasswordLength: AUTH_PASSWORD_MIN_LENGTH,
    maxPasswordLength: AUTH_PASSWORD_MAX_LENGTH,
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: SESSION_COOKIE_CACHE_MAX_AGE_SECONDS,
    },
  },
  plugins: [tanstackStartCookies()],
})
