import type { z } from 'zod'
import type { extractedCardSchema } from '@/lib/validators/ocr'

export type ExtractedCard = z.infer<typeof extractedCardSchema>
export type ExtractionCategory = { id: string; name: string }
export type CardExtractor = (
  text: string,
  categories: ExtractionCategory[],
) => Promise<ExtractedCard>

export type CardAutofillSuggestionsProps = {
  suggestions: ExtractedCard
  current: ExtractedCard
  categories: ExtractionCategory[]
  disabled: boolean
  onApply: (field?: keyof ExtractedCard) => void
}
