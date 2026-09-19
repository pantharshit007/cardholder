import { AIModel } from '@/types/ai'
import type { ModelFallbacks } from '@/types/ai'

export const APP_NAME = 'CardHolder'

export const DEV_SERVER_PORT = 3000

export const LOGIN_PATH = '/login' as const
export const SIGNUP_PATH = '/signup' as const
export const DEFAULT_POST_AUTH_PATH = '/' as const
export const CARDS_PATH = '/' as const
export const CARD_NEW_PATH = '/cards/new' as const
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
export const CARD_NAME_MIN_LENGTH = 1

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

export const BYTES_PER_MEBIBYTE = 1024 * 1024
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024
export const MAX_IMAGE_SIZE_MEBIBYTES = MAX_IMAGE_BYTES / BYTES_PER_MEBIBYTE
export const MULTIPART_OVERHEAD_BYTES = 256 * 1024
export const MAX_UPLOAD_REQUEST_BYTES =
  MAX_IMAGE_BYTES + MULTIPART_OVERHEAD_BYTES

export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const

export const CARD_THUMBNAIL_WIDTH = 400
export const CARD_THUMBNAIL_HEIGHT = 250
export const CARD_DETAIL_IMAGE_WIDTH = 1200
export const CARDS_PAGE_SKELETON_COUNT = 8
export const COPY_FEEDBACK_TIMEOUT_MS = 2000
export const CLOUDINARY_API_BASE_URL = 'https://api.cloudinary.com/v1_1'
export const CLOUDINARY_CLEANUP_BATCH_SIZE = 10

export const CARD_SORT_OPTIONS = [
  'newest',
  'oldest',
  'name_asc',
  'name_desc',
] as const

export type CardSortOption = (typeof CARD_SORT_OPTIONS)[number]

export const OCR_CONFIG = {
  apiPath: '/api/ocr',
  rateLimit: { requests: 10, windowMs: 60_000, millisecondsPerSecond: 1000 },
  endpoint: 'https://api.ocr.space/parse/image',
  allowedMimeTypes: ['image/jpeg', 'image/png'],
  engine: '2',
  language: 'eng',
  timeoutMs: 30_000,
  maxImageBytes: 1_000_000,
  get maxRequestBytes() {
    return this.maxImageBytes + MULTIPART_OVERHEAD_BYTES
  },
  maxTextLength: 20_000,
  image: {
    maxDimension: 2000,
    quality: 0.85,
    resizeFactor: 0.8,
    resizeAttempts: 6,
  },
} as const

export const CARD_EXTRACTION_CONFIG = {
  models: [
    AIModel.GeminiFlashLite,
    AIModel.GlmFlash,
    AIModel.DeepSeekFlash,
  ] as const satisfies ModelFallbacks,
  timeoutMs: 30_000,
  maxTokens: 1024,
  autofillTimeoutMs: 75_000,
} as const

export const AUTOFILL_FIELDS = [
  { key: 'name', label: 'Contact name' },
  { key: 'company', label: 'Company' },
  { key: 'phone', label: 'Phone' },
  { key: 'email', label: 'Email' },
  { key: 'categoryId', label: 'Category' },
] as const
