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

export const auth = betterAuth({
  appName: APP_NAME,
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  trustedOrigins: [env.BETTER_AUTH_URL],
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
