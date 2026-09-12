import { POSTGRES_UNIQUE_VIOLATION } from '@/constants'

function getErrorCode(error: unknown): string | undefined {
  const seen = new Set<unknown>()
  let current: unknown = error

  while (current && typeof current === 'object' && !seen.has(current)) {
    seen.add(current)

    if ('code' in current && typeof current.code === 'string') {
      return current.code
    }

    current = 'cause' in current ? current.cause : undefined
  }

  return undefined
}

export function isUniqueViolation(error: unknown): boolean {
  return getErrorCode(error) === POSTGRES_UNIQUE_VIOLATION
}
