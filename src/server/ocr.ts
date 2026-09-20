import type { AutofillStage } from '@/types/error'
import { describeAutofillError } from '@/utils/error'
import { OCR_CONFIG } from '@/constants'
import { env } from '@/env'
import { getRequestSession } from '@/lib/session'
import { emailVerificationFailure } from '@/lib/verified-user'
import { consumeOcrQuota } from '@/lib/ocr-rate-limit'
import { getTrustedOrigins } from '@/utils/trusted-origins'
import { ocrImageSchema } from '@/lib/validators/ocr'
import { extractCardFromText } from '@/services/card-extraction'
import { listCategoriesForExtraction } from '@/services/category.service'
import { ocrFromImage } from '@/services/ocr'
import { readFormDataWithLimit } from '@/utils/request-body'

/** Authenticate, limit, and validate scans before calling either external provider. */
export async function handleCardAutofill(request: Request): Promise<Response> {
  const session = await getRequestSession(request.headers)
  const user = session?.user
  const headers = { 'Cache-Control': 'no-store' }
  if (!user)
    return Response.json(
      { message: 'Your session has expired. Please sign in again.' },
      { status: 401, headers },
    )
  const verificationFailure = emailVerificationFailure(user)
  if (verificationFailure) return verificationFailure

  // Only trusted-origin browser requests may initiate paid extraction.
  const origin = request.headers.get('origin')
  if (
    !origin ||
    !getTrustedOrigins(request, env.BETTER_AUTH_URL).includes(origin)
  ) {
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
  const quota = consumeOcrQuota(user.id)
  if (!quota.allowed)
    return Response.json(
      {
        message: `Scan limit reached. Try again in ${quota.retryAfter} seconds.`,
      },
      {
        status: 429,
        headers: { ...headers, 'Retry-After': String(quota.retryAfter) },
      },
    )
  let stage: AutofillStage = 'upload'
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
    const isMultilingual =
      form.get('multilingual') === 'true' || form.get('multilingual') === '1'
    stage = 'ocr'
    const text = await ocrFromImage(parsed.data, { isMultilingual })
    stage = 'categories'
    const categories = await listCategoriesForExtraction(user.id)
    stage = 'extraction'
    const data = await extractCardFromText(text, categories)
    return Response.json(data, { headers })
  } catch (error) {
    const failure = describeAutofillError(error, stage)
    console.warn('Card autofill failed', {
      stage: failure.stage,
      reason: failure.reason,
      upstreamStatus: failure.upstreamStatus,
    })
    return Response.json(
      { message: failure.message, stage: failure.stage, code: failure.reason },
      { status: failure.status, headers },
    )
  }
}
