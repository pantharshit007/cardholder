import { CARD_EXTRACTION_CONFIG, OCR_CONFIG } from '@/constants'
import { readAutofillResponse } from '@/services/autofill-response'
import type { ExtractedCard } from '@/types/ocr'

export interface AutofillCardOptions {
  isMultilingual?: boolean
}

/** Encode a scan-sized JPEG while leaving the original upload untouched. */
async function prepareScanImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  try {
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Could not prepare the image for scanning.')
    let scale = Math.min(
      1,
      OCR_CONFIG.image.maxDimension / Math.max(bitmap.width, bitmap.height),
    )
    for (
      let attempt = 0;
      attempt < OCR_CONFIG.image.resizeAttempts;
      attempt++
    ) {
      canvas.width = Math.max(1, Math.round(bitmap.width * scale))
      canvas.height = Math.max(1, Math.round(bitmap.height * scale))
      context.fillStyle = '#ffffff'
      context.fillRect(0, 0, canvas.width, canvas.height)
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/jpeg', OCR_CONFIG.image.quality),
      )
      if (blob && blob.size <= OCR_CONFIG.maxImageBytes) return blob
      scale *= OCR_CONFIG.image.resizeFactor
    }
    throw new Error('This image is too large to scan. Try a smaller image.')
  } finally {
    bitmap.close()
  }
}

/** Submit the prepared image with cancellation and parse the API result. */
export async function autofillCardFromImage(
  file: File,
  signal: AbortSignal,
  options?: AutofillCardOptions,
): Promise<ExtractedCard> {
  const image = await prepareScanImage(file)
  signal.throwIfAborted()
  const body = new FormData()
  body.set('file', image, 'card.jpg')
  if (options?.isMultilingual) {
    body.set('multilingual', 'true')
  }
  const response = await fetch(OCR_CONFIG.apiPath, {
    method: 'POST',
    body,
    signal: AbortSignal.any([
      signal,
      AbortSignal.timeout(CARD_EXTRACTION_CONFIG.autofillTimeoutMs),
    ]),
  })
  return readAutofillResponse(response)
}
