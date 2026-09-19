import { OCR_CONFIG } from '@/constants'
import { env } from '@/env'
import { requireUser } from '@/lib/require-user'
import { ocrImageSchema } from '@/lib/validators/ocr'
import { extractCardFromText } from '@/services/card-extraction'
import { listCategoriesForExtraction } from '@/services/category.service'
import { ocrFromImage } from '@/services/ocr'
import {
  readFormDataWithLimit,
  RequestBodyTooLargeError,
} from '@/utils/request-body'

export async function handleCardAutofill(request: Request): Promise<Response> {
  const user = await requireUser()
  const headers = { 'Cache-Control': 'no-store' }
  // Only same-origin browser requests may initiate paid extraction.
  if (request.headers.get('origin') !== new URL(request.url).origin) {
    return Response.json(
      { message: 'Invalid request origin.' },
      { status: 403, headers },
    )
  }
  if (!env.OPENROUTER_API_KEY) {
    return Response.json(
      {
        message: 'Autofill is unavailable. Please enter the details manually.',
      },
      { status: 503, headers },
    )
  }
  try {
    const form = await readFormDataWithLimit(
      request,
      OCR_CONFIG.maxRequestBytes,
    )
    const parsed = ocrImageSchema.safeParse(form.get('file'))
    if (!parsed.success) {
      return Response.json(
        { message: 'Choose a JPEG or PNG scan under 1 MB.' },
        { status: 400, headers },
      )
    }
    const text = await ocrFromImage(parsed.data)
    const categories = await listCategoriesForExtraction(user.id)
    const data = await extractCardFromText(text, categories)
    return Response.json(data, { headers })
  } catch (error) {
    return Response.json(
      {
        message:
          'Could not scan this card. Try a clearer image or enter the details manually.',
      },
      {
        status: error instanceof RequestBodyTooLargeError ? 413 : 502,
        headers,
      },
    )
  }
}
