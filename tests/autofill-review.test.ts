import assert from 'node:assert/strict'
import { test } from 'node:test'

import { OCR_CONFIG } from '../src/constants'
import { createOcrRateLimiter } from '../src/lib/ocr-rate-limit'
import { createExtractionJsonSchema } from '../src/lib/validators/extraction-schema'
import { readAutofillResponse } from '../src/services/autofill-response'
import { autofillValue } from '../src/utils/autofill-value'
import { getTrustedOrigins } from '../src/utils/trusted-origins'

test('automatic suggestions preserve entered values and deliberate clears across scans', () => {
  assert.equal(
    autofillValue('name', 'My name', 'Suggested name', false),
    'My name',
  )
  assert.equal(autofillValue('name', '', 'Suggested name', true), '')
  assert.equal(
    autofillValue('categoryId', 'none', 'suggested-id', true),
    'none',
  )
  assert.equal(
    autofillValue('location', '', 'Tokyo, Japan', false),
    'Tokyo, Japan',
  )
  assert.equal(
    autofillValue('name', '', 'Suggested name', false),
    'Suggested name',
  )
})

test('explicit suggestion application replaces values but never clears absent data', () => {
  assert.equal(
    autofillValue('name', 'My name', 'Suggested name', true, true),
    'Suggested name',
  )
  assert.equal(autofillValue('name', 'My name', null, true, true), 'My name')
  assert.equal(
    autofillValue('location', 'Old Location', 'New Location', true, true),
    'New Location',
  )
  assert.equal(autofillValue('phone', '555', '', false, true), '555')
  assert.equal(
    autofillValue('categoryId', 'none', 'suggested-id', true, true),
    'suggested-id',
  )
})

test('quota allows ten requests, isolates users, and resets at the window boundary', () => {
  const consume = createOcrRateLimiter()
  for (let i = 0; i < OCR_CONFIG.rateLimit.requests; i++)
    assert.equal(consume('user-a', 0).allowed, true)
  assert.deepEqual(consume('user-a', 0), { allowed: false, retryAfter: 60 })
  assert.equal(consume('user-b', 0).allowed, true)
  assert.deepEqual(consume('user-a', OCR_CONFIG.rateLimit.windowMs - 1), {
    allowed: false,
    retryAfter: 1,
  })
  assert.equal(consume('user-a', OCR_CONFIG.rateLimit.windowMs).allowed, true)
})

test('origin policy supports configured public origin and trusted TLS proxies but rejects outsiders', () => {
  const baseUrl = 'https://cards.example.com'
  const origins = [
    'https://cards.example.com',
    'https://my-machine.example.ts.net',
    'https://my-dabba',
    'http://100.64.0.1:3000',
    'http://localhost:3000',
  ]
  for (const origin of origins) {
    const request = new Request('http://127.0.0.1:3000/api/ocr', {
      headers: { origin },
    })
    assert.ok(getTrustedOrigins(request, baseUrl).includes(origin))
  }
  for (const origin of [
    'https://evil.example',
    'https://evil.ts.net.attacker.com',
    'null',
    'not-a-url',
  ]) {
    const request = new Request('http://127.0.0.1:3000/api/ocr', {
      headers: { origin },
    })
    assert.equal(getTrustedOrigins(request, baseUrl).includes(origin), false)
  }
})

test('error handling preserves server status messages and handles non-JSON errors', async () => {
  for (const status of [400, 401, 403, 413, 429, 503]) {
    await assert.rejects(
      readAutofillResponse(
        Response.json({ message: `Status ${status}` }, { status }),
      ),
      { message: `Status ${status}` },
    )
  }
  await assert.rejects(
    readAutofillResponse(
      new Response('<html>Bad gateway</html>', { status: 502 }),
    ),
    /Could not scan/,
  )
})

test('provider schema is portable and restricts category IDs without local email constraints', () => {
  const schema = createExtractionJsonSchema(['allowed-category'])
  assert.deepEqual(schema.properties.email, { type: ['string', 'null'] })
  assert.deepEqual(schema.properties.location, { type: ['string', 'null'] })
  assert.ok(schema.required.includes('location'))
  assert.equal(schema.additionalProperties, false)
  assert.deepEqual(schema.properties.categoryId, {
    type: ['string', 'null'],
    enum: ['allowed-category', null],
  })
  assert.deepEqual(createExtractionJsonSchema([]).properties.categoryId, {
    type: 'null',
  })
  assert.doesNotMatch(
    JSON.stringify(schema),
    /\$schema|anyOf|format|pattern|maxLength/,
  )
})
