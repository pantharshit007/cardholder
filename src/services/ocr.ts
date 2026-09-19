import { OCR_CONFIG } from '@/constants'
import { env } from '@/env'
import { ocrResponseSchema, ocrTextSchema } from '@/lib/validators/ocr'

/** Read transient OCR text from a bounded image without persisting it. */
export async function ocrFromImage(file: Blob): Promise<string> {
  const body = new FormData()
  body.set('file', file, file.type === 'image/png' ? 'card.png' : 'card.jpg')
  body.set('language', OCR_CONFIG.language)
  body.set('OCREngine', OCR_CONFIG.engine)
  body.set('scale', 'true')
  body.set('detectOrientation', 'true')
  body.set('isOverlayRequired', 'false')
  const response = await fetch(OCR_CONFIG.endpoint, {
    method: 'POST',
    headers: { apikey: env.OCR_SPACE_API_KEY },
    body,
    signal: AbortSignal.timeout(OCR_CONFIG.timeoutMs),
  })
  if (!response.ok)
    throw Object.assign(new Error('OCR request failed.'), {
      statusCode: response.status,
    })
  const result = ocrResponseSchema.parse(await response.json())
  if (result.IsErroredOnProcessing || ![1, 2].includes(result.OCRExitCode)) {
    throw new Error('OCR could not read this image.')
  }
  return ocrTextSchema.parse(
    result.ParsedResults?.filter((page) => page.FileParseExitCode === 1)
      .map((page) => page.ParsedText)
      .join('\n'),
  )
}
