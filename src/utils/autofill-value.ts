import type { ExtractedCard } from '@/types/ocr'

/** Automatic fills honor manual clears; explicit application can replace a value. */
export function autofillValue(
  field: keyof ExtractedCard,
  current: string,
  suggested: string | null,
  edited: boolean,
  explicit = false,
): string {
  if (!suggested?.trim()) return current
  const empty = field === 'categoryId' ? current === 'none' : !current.trim()
  return explicit || (empty && !edited) ? suggested : current
}
