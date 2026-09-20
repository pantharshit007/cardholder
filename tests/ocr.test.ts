import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'

import { CARD_EXTRACTION_CONFIG, OCR_CONFIG } from '../src/constants'
import { extractedCardSchema, ocrImageSchema } from '../src/lib/validators/ocr'
import { extractCardFromText } from '../src/services/card-extraction'
import { ocrFromImage } from '../src/services/ocr'
import {
  readFormDataWithLimit,
  RequestBodyTooLargeError,
} from '../src/utils/request-body'

const originalFetch = globalThis.fetch
afterEach(() => {
  globalThis.fetch = originalFetch
})
const contact = {
  name: 'VISHWA KUMAR',
  phone: '+123-456-7890',
  email: 'hello@zivora.com',
  company: 'Zivora',
  location: 'San Francisco, CA',
  categoryId: null,
}
function completion(content: string, finishReason = 'stop') {
  return Response.json({
    id: 'test-completion',
    created: 1,
    model: CARD_EXTRACTION_CONFIG.models[0],
    object: 'chat.completion',
    system_fingerprint: 'test',
    choices: [
      {
        index: 0,
        finish_reason: finishReason,
        logprobs: null,
        message: { role: 'assistant', content, refusal: null },
      },
    ],
  })
}
const image = new Blob(['image'], { type: 'image/jpeg' })

test('OCR sends a file, then OpenRouter returns only validated contact fields', async () => {
  let calls = 0
  globalThis.fetch = async (url, options) => {
    calls++
    if (calls === 1) {
      assert.equal(url, 'https://api.ocr.space/parse/image')
      assert.ok(options?.body instanceof FormData)
      assert.ok(options.body.get('file') instanceof Blob)
      assert.equal(options.body.get('url'), null)
      return Response.json({
        IsErroredOnProcessing: false,
        OCRExitCode: '1',
        ParsedResults: [
          {
            FileParseExitCode: '1',
            ParsedText:
              'VISHWA KUMAR\n+123-456-7890\nhello@zivora.com\nZivora\nSan Francisco, CA',
          },
        ],
      })
    }
    const body =
      url instanceof Request
        ? await url.json()
        : JSON.parse(String(options?.body))
    assert.deepEqual(body.models, [...CARD_EXTRACTION_CONFIG.models])
    assert.equal(body.model, undefined)
    assert.equal(body.provider.data_collection, 'deny')
    assert.equal(body.models.includes('meta/muse-spark-1.3-contributor'), false)
    assert.equal(body.response_format.type, 'json_schema')
    assert.match(body.messages[1].content, /VISHWA KUMAR/)
    return completion(JSON.stringify(contact))
  }
  assert.deepEqual(
    await extractCardFromText(await ocrFromImage(image), []),
    contact,
  )
  assert.equal(calls, 2)
})

test('OCR rejects provider errors, blank text, and excessive text', async () => {
  for (const payload of [
    { IsErroredOnProcessing: true, OCRExitCode: 3 },
    {
      IsErroredOnProcessing: false,
      OCRExitCode: 1,
      ParsedResults: [{ FileParseExitCode: 1, ParsedText: ' ' }],
    },
    {
      IsErroredOnProcessing: false,
      OCRExitCode: 1,
      ParsedResults: [
        {
          FileParseExitCode: 1,
          ParsedText: 'a'.repeat(OCR_CONFIG.maxTextLength + 1),
        },
      ],
    },
  ]) {
    globalThis.fetch = async () => Response.json(payload)
    await assert.rejects(ocrFromImage(image))
  }
})

test('AI rejects malformed, truncated, and invalid contact output', async () => {
  for (const [content, finish_reason] of [
    ['not JSON', 'stop'],
    [JSON.stringify(contact), 'length'],
    [JSON.stringify({ ...contact, email: 'invalid' }), 'stop'],
    [JSON.stringify({ ...contact, notes: 'injected field' }), 'stop'],
  ]) {
    globalThis.fetch = async () => completion(content!, finish_reason)
    await assert.rejects(extractCardFromText('OCR text', []))
  }
})

test('rate limits and network failures reject without a fabricated result', async () => {
  globalThis.fetch = async () => new Response('', { status: 429 })
  await assert.rejects(ocrFromImage(image))
  await assert.rejects(extractCardFromText('OCR text', []))
  globalThis.fetch = async () => {
    throw new DOMException('Timeout', 'TimeoutError')
  }
  await assert.rejects(ocrFromImage(image))
  await assert.rejects(extractCardFromText('OCR text', []))
})

test('validates scan size/type and nullable contact fields', () => {
  assert.equal(ocrImageSchema.safeParse(image).success, true)
  assert.equal(
    ocrImageSchema.safeParse(new Blob([], { type: 'image/jpeg' })).success,
    false,
  )
  assert.equal(
    ocrImageSchema.safeParse(new Blob(['x'], { type: 'image/svg+xml' }))
      .success,
    false,
  )
  assert.equal(
    ocrImageSchema.safeParse(
      new Blob([new Uint8Array(OCR_CONFIG.maxImageBytes + 1)], {
        type: 'image/png',
      }),
    ).success,
    false,
  )
  assert.equal(
    extractedCardSchema.safeParse({
      name: null,
      phone: null,
      email: null,
      company: null,
      location: null,
      categoryId: null,
    }).success,
    true,
  )
})

test('request body limit is enforced without relying on content-length', async () => {
  const form = new FormData()
  form.set('file', image)
  const request = new Request('https://example.com/api/ocr', {
    method: 'POST',
    body: form,
  })
  await assert.rejects(
    readFormDataWithLimit(request, 1),
    RequestBodyTooLargeError,
  )
})

test('AI receives categories and descriptions and selects only an offered category', async () => {
  const categories = [
    { id: '00000000-0000-4000-8000-000000000001', name: 'Design' },
  ]
  globalThis.fetch = async (request, options) => {
    const body =
      request instanceof Request
        ? await request.json()
        : JSON.parse(String(options?.body))
    const payload = JSON.parse(body.messages[1].content)
    assert.deepEqual(payload.categories, categories)
    assert.equal(payload.text, 'Zivora \u2014 brand design and illustration')
    return completion(
      JSON.stringify({ ...contact, categoryId: categories[0]!.id }),
    )
  }
  const result = await extractCardFromText(
    'Zivora \u2014 brand design and illustration',
    categories,
  )
  assert.equal(result.categoryId, categories[0]!.id)
  globalThis.fetch = async () =>
    completion(
      JSON.stringify({
        ...contact,
        categoryId: '00000000-0000-4000-8000-000000000002',
      }),
    )
  await assert.rejects(extractCardFromText('OCR text', categories))
  await assert.rejects(extractCardFromText('OCR text', []))
})

test('AI may leave a card uncategorized when no offered category fits', async () => {
  globalThis.fetch = async () => completion(JSON.stringify(contact))
  const result = await extractCardFromText('OCR text', [
    { id: '00000000-0000-4000-8000-000000000001', name: 'Unrelated category' },
  ])
  assert.equal(result.categoryId, null)
})
