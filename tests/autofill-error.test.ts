import assert from 'node:assert/strict'
import { test } from 'node:test'
import { describeAutofillError } from '../src/utils/autofill-error'
import { RequestBodyTooLargeError } from '../src/utils/request-body'

test('reports provider stage and SDK incompatibility without exposing raw errors', () => {
  const error = Object.assign(new Error('SECRET and private OCR text'), {
    name: 'ResponseValidationError',
    statusCode: 200,
    body: 'PRIVATE BODY',
  })
  const result = describeAutofillError(error, 'extraction')
  assert.equal(result.reason, 'sdk_response_validation')
  assert.equal(result.stage, 'extraction')
  assert.doesNotMatch(
    JSON.stringify(result),
    /SECRET|PRIVATE BODY|private OCR text/,
  )
})

test('separates provider credentials, credits, quotas, and timeouts', () => {
  for (const [statusCode, reason] of [
    [401, 'provider_auth'],
    [403, 'provider_auth'],
    [402, 'provider_credits'],
    [429, 'provider_rate_limit'],
  ] as const) {
    assert.equal(
      describeAutofillError(
        Object.assign(new Error(), { statusCode }),
        'extraction',
      ).reason,
      reason,
    )
  }
  assert.equal(
    describeAutofillError(new DOMException('Timeout', 'TimeoutError'), 'ocr')
      .status,
    504,
  )
  assert.equal(
    describeAutofillError(new RequestBodyTooLargeError(), 'upload').status,
    413,
  )
  assert.equal(describeAutofillError(new Error(), 'categories').status, 500)
})
