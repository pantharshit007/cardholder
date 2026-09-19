import type { AutofillFailure, AutofillStage } from '@/types/autofill-error'
import { RequestBodyTooLargeError } from '@/utils/request-body'

/** Describe failures without exposing provider bodies, credentials, or OCR text. */
export function describeAutofillError(
  error: unknown,
  stage: AutofillStage,
): AutofillFailure {
  const errorName = error instanceof Error ? error.name : ''
  const upstreamStatus =
    typeof error === 'object' &&
    error !== null &&
    'statusCode' in error &&
    typeof error.statusCode === 'number'
      ? error.statusCode
      : undefined
  if (error instanceof RequestBodyTooLargeError)
    return {
      stage,
      status: 413,
      reason: 'body_too_large',
      message: 'The scan image is too large. Choose a smaller image.',
    }
  if (stage === 'upload')
    return {
      stage,
      status: 400,
      reason: 'invalid_upload',
      message:
        'The image upload could not be read. Please select the image again.',
    }
  if (stage === 'categories')
    return {
      stage,
      status: 500,
      reason: 'category_lookup_failed',
      message: 'Could not load your categories. Please try again.',
    }
  const provider = stage === 'ocr' ? 'OCR.space' : 'OpenRouter'
  if (errorName === 'TimeoutError' || errorName === 'AbortError')
    return {
      stage,
      status: 504,
      reason: 'timeout',
      message: `${provider} took too long to respond. Please try again.`,
    }
  if (upstreamStatus === 401 || upstreamStatus === 403)
    return {
      stage,
      upstreamStatus,
      status: 502,
      reason: 'provider_auth',
      message: `${provider} rejected the server credentials or access settings. Check the server configuration.`,
    }
  if (upstreamStatus === 402)
    return {
      stage,
      upstreamStatus,
      status: 502,
      reason: 'provider_credits',
      message:
        'OpenRouter reports insufficient credits. Check your OpenRouter balance.',
    }
  if (upstreamStatus === 429)
    return {
      stage,
      upstreamStatus,
      status: 503,
      reason: 'provider_rate_limit',
      message: `${provider} is rate-limiting requests. Please try again later.`,
    }
  if (errorName === 'ResponseValidationError')
    return {
      stage,
      upstreamStatus,
      status: 502,
      reason: 'sdk_response_validation',
      message:
        'OpenRouter returned a response the SDK could not read. This is a service compatibility issue, not an image-quality problem.',
    }
  if (errorName === 'ZodError' || errorName === 'SyntaxError')
    return {
      stage,
      upstreamStatus,
      status: 502,
      reason: 'invalid_response',
      message: `${provider} returned an unexpected result. Please try again or enter the details manually.`,
    }
  return {
    stage,
    upstreamStatus,
    status: 502,
    reason: 'provider_failed',
    message:
      stage === 'ocr'
        ? 'OCR.space could not read the image. Please try again or use a clearer photo.'
        : 'OpenRouter could not extract the card details. Please try again or enter them manually.',
  }
}
