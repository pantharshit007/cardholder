import { AIModel } from '@/types/ai'
import type { ModelFallbacks } from '@/types/ai'

/**
 * Cohesive Application & Server Configuration
 */
export const APP_CONFIG = {
  name: 'CardHolder',
  githubRepoUrl: 'https://github.com/pantharshit007/cardholder',
  devServerPort: 3000,
} as const

/**
 * Cohesive Navigation & Route Paths Configuration
 */
export const NAV_PATHS = {
  login: '/login',
  signup: '/signup',
  cards: '/cards',
  cardNew: '/cards/new',
  categories: '/categories',
  defaultPostAuth: '/cards',
} as const

/**
 * Cohesive Authentication Configuration
 */
export const AUTH_CONFIG = {
  passwordMinLength: 8,
  passwordMaxLength: 128,
  nameMaxLength: 80,
  /** Better Auth cookie cache, in seconds. */
  sessionCookieCacheMaxAgeSeconds: 5 * 60,
  paths: {
    login: NAV_PATHS.login,
    signup: NAV_PATHS.signup,
    defaultPostAuth: NAV_PATHS.defaultPostAuth,
  },
} as const

/**
 * Cohesive Browser Storage Keys Configuration
 */
export const STORAGE_KEYS = {
  theme: 'cardholder-theme',
  ocrMultilingual: 'cardholder-ocr-multilingual',
} as const

/**
 * Cohesive Database Configuration
 */
export const DB_CONFIG = {
  /** Allowed Drizzle drivers. Selection lives in `src/db/index.ts` via t3-env. */
  drivers: ['pg', 'neon'] as const,
  /** Default for local Docker Postgres. */
  devDriver: 'pg' as const,
  /** Default for Neon in production. */
  prodDriver: 'neon' as const,
  /** Postgres unique_violation error code. Used to map duplicate category names. */
  postgresUniqueViolation: '23505',
} as const

export type DbDriver = (typeof DB_CONFIG.drivers)[number]

/**
 * Cohesive Category Configuration & Colors
 */
export const CATEGORY_CONFIG = {
  nameMinLength: 1,
  nameMaxLength: 50,
  colorHexes: [
    '#6B4F3A',
    '#A15C38',
    '#5F6B3A',
    '#5C6468',
    '#7A3E4A',
    '#9A7B3C',
  ] as const,
  colors: [
    { hex: '#6B4F3A', label: 'Ink' },
    { hex: '#A15C38', label: 'Clay' },
    { hex: '#5F6B3A', label: 'Olive' },
    { hex: '#5C6468', label: 'Slate' },
    { hex: '#7A3E4A', label: 'Wine' },
    { hex: '#9A7B3C', label: 'Brass' },
  ] as const,
  rowStaggerMs: 45,
  defaultStripe: 'var(--primary)',
} as const

/**
 * Cohesive Field Length Limits
 */
export const FIELD_LIMITS = {
  name: 120,
  categoryName: CATEGORY_CONFIG.nameMaxLength,
  phone: 40,
  email: 254,
  location: 120,
  company: 120,
  notes: 2000,
} as const

/**
 * Cohesive Card Configuration
 */
export const CARD_CONFIG = {
  nameMinLength: 1,
  pageSize: 24,
  thumbnailWidth: 400,
  thumbnailHeight: 250,
  detailImageWidth: 1200,
  skeletonCount: 8,
  copyFeedbackTimeoutMs: 2000,
  sortOptions: ['newest', 'oldest', 'name_asc', 'name_desc'] as const,
  landingStack: [
    { topRem: 4, leftPercent: 18, rotateDeg: -1.5, delayMs: 180, zIndex: 1 },
    { topRem: 9.5, leftPercent: 8, rotateDeg: -4, delayMs: 270, zIndex: 2 },
    { topRem: 15, leftPercent: 0, rotateDeg: 3, delayMs: 360, zIndex: 3 },
  ] as const,
  limits: FIELD_LIMITS,
} as const

export type CardSortOption = (typeof CARD_CONFIG.sortOptions)[number]

/**
 * Cohesive Image Upload & Cloudinary Configuration
 */
export const BYTES_PER_MEBIBYTE = 1024 * 1024
export const MULTIPART_OVERHEAD_BYTES = 256 * 1024
const MAX_IMAGE_BYTES_VAL = 5 * 1024 * 1024

export const IMAGE_UPLOAD_ERRORS = {
  saveFailed: 'Could not save the image upload. Please try again.',
  providerFailed:
    'The image service could not upload your image. Please try again.',
  networkFailed:
    'Could not reach the server. Check your connection and try again.',
  invalidImage:
    'Please choose a JPEG, PNG, or WebP image within the upload size limit.',
  unauthorized: 'Your session has expired. Please sign in again.',
  tooLarge: 'The image upload is too large. Please choose a smaller image.',
  unavailable:
    'Image upload is temporarily unavailable. Please try again later.',
} as const

export const IMAGE_UPLOAD_CONFIG = {
  bytesPerMebibyte: BYTES_PER_MEBIBYTE,
  maxSizeBytes: MAX_IMAGE_BYTES_VAL,
  maxSizeMebibytes: MAX_IMAGE_BYTES_VAL / BYTES_PER_MEBIBYTE,
  multipartOverheadBytes: MULTIPART_OVERHEAD_BYTES,
  maxRequestBytes: MAX_IMAGE_BYTES_VAL + MULTIPART_OVERHEAD_BYTES,
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'] as const,
  cloudinaryApiBaseUrl: 'https://api.cloudinary.com/v1_1',
  cloudinaryCleanupBatchSize: 10,
  cloudinaryDeletionTimeoutMs: 10_000,
  errors: IMAGE_UPLOAD_ERRORS,
} as const

/**
 * Cohesive OCR Configuration
 */
export const OCR_CONFIG = {
  apiPath: '/api/ocr',
  rateLimit: { requests: 10, windowMs: 60_000, millisecondsPerSecond: 1000 },
  endpoint: 'https://api.ocr.space/parse/image',
  allowedMimeTypes: ['image/jpeg', 'image/png'],
  engine: '2',
  multilingualEngine: '3',
  language: 'eng',
  multilingualLanguage: 'auto',
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

/**
 * Cohesive AI Extraction Configuration
 */
export const CARD_EXTRACTION_CONFIG = {
  models: [
    AIModel.GeminiFlashLite,
    AIModel.GlmFlash,
    AIModel.DeepSeekFlash,
  ] as const satisfies ModelFallbacks,
  timeoutMs: 30_000,
  maxTokens: 1024,
  autofillTimeoutMs: 75_000,
  systemPrompt: `You extract structured contact details from raw OCR text scanned from a business or visiting card.
Return a JSON object with:
- "name": string or null (the person's full name, not company name)
- "phone": string or null (primary phone/mobile/contact number, formatted cleanly)
- "email": string or null (contact email address)
- "company": string or null (business/company/organization name)
- "location": string or null (physical address, city, state, country, or postal code)
- "categoryId": string or null (UUID of the best matching category from the offered list, or null if none fit)

Strict rules:
- Extract ONLY what is plausibly present in the text.
- Do NOT guess or fabricate details that are not visible or implied.
- If a detail is missing or ambiguous, use null.
- For categoryId: You MUST select only from the offered categories provided with their IDs. If no offered category is a good match, return null. Never invent a category ID.
- Extract any physical address or location information into "location".
- Return ONLY the JSON object conforming to the schema. Do not add markdown or conversational explanation.`,
} as const

export const AUTOFILL_FIELDS = [
  { key: 'name', label: 'Contact name' },
  { key: 'company', label: 'Company' },
  { key: 'phone', label: 'Phone' },
  { key: 'email', label: 'Email' },
  { key: 'location', label: 'Location' },
  { key: 'categoryId', label: 'Category' },
] as const

/* ------------------------------------------------------------------
 * Backward-compatible standalone exports (derived from config objects)
 * ------------------------------------------------------------------ */

export const APP_NAME = APP_CONFIG.name
export const GITHUB_REPO_URL = APP_CONFIG.githubRepoUrl
export const DEV_SERVER_PORT = APP_CONFIG.devServerPort

export const LOGIN_PATH = NAV_PATHS.login
export const SIGNUP_PATH = NAV_PATHS.signup
export const DEFAULT_POST_AUTH_PATH = NAV_PATHS.defaultPostAuth
export const CARDS_PATH = NAV_PATHS.cards
export const CARD_NEW_PATH = NAV_PATHS.cardNew
export const CATEGORIES_PATH = NAV_PATHS.categories

export const AUTH_PASSWORD_MIN_LENGTH = AUTH_CONFIG.passwordMinLength
export const AUTH_PASSWORD_MAX_LENGTH = AUTH_CONFIG.passwordMaxLength
export const AUTH_NAME_MAX_LENGTH = AUTH_CONFIG.nameMaxLength
export const SESSION_COOKIE_CACHE_MAX_AGE_SECONDS =
  AUTH_CONFIG.sessionCookieCacheMaxAgeSeconds

export const THEME_STORAGE_KEY = STORAGE_KEYS.theme
export const OCR_MULTILINGUAL_STORAGE_KEY = STORAGE_KEYS.ocrMultilingual

export const DB_DRIVERS = DB_CONFIG.drivers
export const DB_DRIVER_DEV = DB_CONFIG.devDriver
export const DB_DRIVER_PROD = DB_CONFIG.prodDriver
export const POSTGRES_UNIQUE_VIOLATION = DB_CONFIG.postgresUniqueViolation

export const LANDING_CARD_STACK = CARD_CONFIG.landingStack

export const CATEGORY_NAME_MIN_LENGTH = CATEGORY_CONFIG.nameMinLength
export const CARD_NAME_MIN_LENGTH = CARD_CONFIG.nameMinLength
export const CATEGORY_COLOR_HEXES = CATEGORY_CONFIG.colorHexes
export const CATEGORY_COLORS = CATEGORY_CONFIG.colors
export const CATEGORY_ROW_STAGGER_MS = CATEGORY_CONFIG.rowStaggerMs
export const DEFAULT_CATEGORY_STRIPE = CATEGORY_CONFIG.defaultStripe

export const PAGE_SIZE = CARD_CONFIG.pageSize
export const CARD_THUMBNAIL_WIDTH = CARD_CONFIG.thumbnailWidth
export const CARD_THUMBNAIL_HEIGHT = CARD_CONFIG.thumbnailHeight
export const CARD_DETAIL_IMAGE_WIDTH = CARD_CONFIG.detailImageWidth
export const CARDS_PAGE_SKELETON_COUNT = CARD_CONFIG.skeletonCount
export const COPY_FEEDBACK_TIMEOUT_MS = CARD_CONFIG.copyFeedbackTimeoutMs
export const CARD_SORT_OPTIONS = CARD_CONFIG.sortOptions

export const MAX_IMAGE_BYTES = IMAGE_UPLOAD_CONFIG.maxSizeBytes
export const MAX_IMAGE_SIZE_MEBIBYTES = IMAGE_UPLOAD_CONFIG.maxSizeMebibytes
export const MAX_UPLOAD_REQUEST_BYTES = IMAGE_UPLOAD_CONFIG.maxRequestBytes
export const ALLOWED_IMAGE_MIME_TYPES = IMAGE_UPLOAD_CONFIG.allowedMimeTypes
export const CLOUDINARY_API_BASE_URL = IMAGE_UPLOAD_CONFIG.cloudinaryApiBaseUrl
export const CLOUDINARY_CLEANUP_BATCH_SIZE =
  IMAGE_UPLOAD_CONFIG.cloudinaryCleanupBatchSize
