import { z } from 'zod'
import { extractedCardSchema } from '@/lib/validators/ocr'
import type { ExtractedCard } from '@/types/ocr'
import { autofillResponseErrorMessage } from '@/utils/error'

const errorSchema = z.object({ message: z.string().trim().min(1) })

/** Preserve safe API messages, with a fallback for non-JSON proxy/network errors. */
export async function readAutofillResponse(
  response: Response,
): Promise<ExtractedCard> {
  if (!response.ok) {
    const error = errorSchema.safeParse(await response.json().catch(() => null))
    throw new Error(
      error.success
        ? error.data.message
        : autofillResponseErrorMessage(response.status),
    )
  }
  return extractedCardSchema.parse(await response.json())
}
