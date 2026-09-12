export const MUTATION_ERROR_CODES = [
  'validation',
  'duplicate',
  'not_found',
  'unknown',
] as const

export type MutationErrorCode = (typeof MUTATION_ERROR_CODES)[number]

export type MutationSuccess<T> = {
  ok: true
  data: T
}

export type MutationFailure = {
  ok: false
  error: string
  code: MutationErrorCode
}

export type MutationResult<T> = MutationSuccess<T> | MutationFailure
