import type {
  MutationErrorCode,
  MutationFailure,
  MutationResult,
} from '@/types/api'

export function mutationOk<T>(data: T): MutationResult<T> {
  return { ok: true, data }
}

export function mutationFail(
  error: string,
  code: MutationErrorCode,
): MutationFailure {
  return { ok: false, error, code }
}
