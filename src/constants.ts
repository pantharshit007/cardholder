export const APP_NAME = 'CardHolder'

export const DEV_SERVER_PORT = 3000

export const LOGIN_PATH = '/login' as const
export const SIGNUP_PATH = '/signup' as const
export const DEFAULT_POST_AUTH_PATH = '/' as const

export const AUTH_PASSWORD_MIN_LENGTH = 8
export const AUTH_PASSWORD_MAX_LENGTH = 128
export const AUTH_NAME_MAX_LENGTH = 80

/** Better Auth cookie cache, in seconds. */
export const SESSION_COOKIE_CACHE_MAX_AGE_SECONDS = 5 * 60

export const THEME_STORAGE_KEY = 'cardholder-theme'

/** Allowed Drizzle drivers. Selection lives in `src/db/index.ts` via t3-env. */
export const DB_DRIVERS = ['pg', 'neon'] as const

export type DbDriver = (typeof DB_DRIVERS)[number]

/** Default for local Docker Postgres. */
export const DB_DRIVER_DEV: DbDriver = 'pg'

/** Default for Neon in production. */
export const DB_DRIVER_PROD: DbDriver = 'neon'

export const LANDING_CARD_STACK = [
  { topRem: 4, leftPercent: 18, rotateDeg: -1.5, delayMs: 180, zIndex: 1 },
  { topRem: 9.5, leftPercent: 8, rotateDeg: -4, delayMs: 270, zIndex: 2 },
  { topRem: 15, leftPercent: 0, rotateDeg: 3, delayMs: 360, zIndex: 3 },
] as const

export const FIELD_LIMITS = {
  name: 120,
  categoryName: 50,
  phone: 40,
  email: 254,
  company: 120,
  notes: 2000,
} as const

export const PAGE_SIZE = 24

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024

export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const
