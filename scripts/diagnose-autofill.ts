import { env } from '../src/env'
import { extractCardFromText } from '../src/services/card-extraction'
import { describeAutofillError } from '../src/utils/autofill-error'

/** Run one synthetic extraction; never print credentials, OCR text, or provider bodies. */
async function main() {
  if (!env.OPENROUTER_API_KEY) {
    console.error(
      'OPENROUTER_API_KEY is not available in this process. No provider request was sent.',
    )
    process.exitCode = 1
    return
  }
  const originalFetch = globalThis.fetch
  globalThis.fetch = async (...args) => {
    const response = await originalFetch(...args)
    const data: unknown = await response
      .clone()
      .json()
      .catch(() => null)
    if (typeof data === 'object' && data !== null) {
      console.info('Provider response summary:', {
        status: response.status,
        hasChoices: 'choices' in data && Array.isArray(data.choices),
        fingerprintType:
          'system_fingerprint' in data
            ? typeof data.system_fingerprint
            : 'missing',
      })
    }
    return response
  }
  try {
    const result = await extractCardFromText(
      'JANE EXAMPLE\nExample Design Studio\nhello@example.com\n+1 202 555 0100\nBrand design and illustration',
      [],
    )
    console.info('Extraction succeeded:', {
      populatedFields: Object.entries(result)
        .filter(([, value]) => Boolean(value))
        .map(([field]) => field),
    })
  } catch (error) {
    console.error(
      'Extraction diagnosis:',
      describeAutofillError(error, 'extraction'),
    )
    // SDK/Zod issue paths identify contract mismatches without exposing raw values.
    const cause: unknown = error instanceof Error ? error.cause : undefined
    const issues =
      typeof cause === 'object' && cause !== null && 'issues' in cause
        ? cause.issues
        : undefined
    const paths: string[] = []
    function collect(value: unknown): void {
      if (Array.isArray(value)) {
        value.forEach(collect)
        return
      }
      if (typeof value !== 'object' || value === null) return
      if ('path' in value && Array.isArray(value.path)) {
        const known = new Set([
          'choices',
          'message',
          'content',
          'finish_reason',
          'system_fingerprint',
          'usage',
          'model',
          'id',
          'created',
          'object',
        ])
        const safePath = value.path.filter(
          (part) =>
            typeof part === 'number' ||
            (typeof part === 'string' && known.has(part)),
        )
        if (safePath.length) paths.push(safePath.join('.'))
      }
      if ('errors' in value) collect(value.errors)
    }
    collect(issues)
    if (paths.length) console.error('Response validation fields:', paths)
    process.exitCode = 1
  } finally {
    globalThis.fetch = originalFetch
  }
}

void main()
