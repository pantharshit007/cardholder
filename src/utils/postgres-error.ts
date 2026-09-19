import { POSTGRES_UNIQUE_VIOLATION } from '@/constants'

export function getPostgresErrorCode(error: unknown): string | undefined {
  const seen = new Set<unknown>()
  let current: unknown = error

  while (current && typeof current === 'object' && !seen.has(current)) {
    seen.add(current)

    if ('code' in current && typeof current.code === 'string') {
      if (/^[0-9A-Z]{5}$/.test(current.code)) return current.code
    }

    current = 'cause' in current ? current.cause : undefined
  }

  return undefined
}

export function isUniqueViolation(error: unknown): boolean {
  return getPostgresErrorCode(error) === POSTGRES_UNIQUE_VIOLATION
}
