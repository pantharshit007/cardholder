export const APP_NAME = 'CardHolder'

export const DEV_SERVER_PORT = 3000

export const LOGIN_PATH = '/login' as const
export const SIGNUP_PATH = '/signup' as const
export const DEFAULT_POST_AUTH_PATH = '/' as const
export const CATEGORIES_PATH = '/categories' as const

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

export const CATEGORY_NAME_MIN_LENGTH = 1

/** Postgres unique_violation. Used to map duplicate category names. */
export const POSTGRES_UNIQUE_VIOLATION = '23505'

export const CATEGORY_COLOR_HEXES = [
  '#6B4F3A',
  '#A15C38',
  '#5F6B3A',
  '#5C6468',
  '#7A3E4A',
  '#9A7B3C',
] as const

export const CATEGORY_COLORS = [
  { hex: CATEGORY_COLOR_HEXES[0], label: 'Ink' },
  { hex: CATEGORY_COLOR_HEXES[1], label: 'Clay' },
  { hex: CATEGORY_COLOR_HEXES[2], label: 'Olive' },
  { hex: CATEGORY_COLOR_HEXES[3], label: 'Slate' },
  { hex: CATEGORY_COLOR_HEXES[4], label: 'Wine' },
  { hex: CATEGORY_COLOR_HEXES[5], label: 'Brass' },
] as const

export const CATEGORY_ROW_STAGGER_MS = 45

export const DEFAULT_CATEGORY_STRIPE = 'var(--primary)'

export const PAGE_SIZE = 24

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024

export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const
