export const APP_NAME = 'CardHolder'

export const DEV_SERVER_PORT = 3000

export const THEME_STORAGE_KEY = 'cardholder-theme'

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
