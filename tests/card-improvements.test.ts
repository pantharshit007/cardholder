import assert from 'node:assert/strict'
import test from 'node:test'

import { createCardSchema, updateCardSchema } from '@/lib/validators/card'
import { createExtractionJsonSchema } from '@/lib/validators/extraction-schema'
import { extractedCardSchema } from '@/lib/validators/ocr'
import { extractPublicIdFromUrl } from '@/services/cloudinary'

test('extractPublicIdFromUrl correctly extracts public IDs from various Cloudinary URL formats', () => {
  assert.equal(
    extractPublicIdFromUrl(
      'https://res.cloudinary.com/demo/image/upload/v1612345678/cardholder/test-card-1.jpg',
    ),
    'cardholder/test-card-1',
  )

  assert.equal(
    extractPublicIdFromUrl(
      'https://res.cloudinary.com/demo/image/upload/c_fill,w_400,h_250,f_auto,q_auto/v1612345678/cardholder/subfolder/test-card-2.png?foo=bar#hash',
    ),
    'cardholder/subfolder/test-card-2',
  )

  assert.equal(
    extractPublicIdFromUrl(
      'https://res.cloudinary.com/demo/image/upload/sample.webp',
    ),
    'sample',
  )

  assert.equal(
    extractPublicIdFromUrl('https://example.com/not-cloudinary.jpg'),
    null,
  )
  assert.equal(extractPublicIdFromUrl(null), null)
  assert.equal(extractPublicIdFromUrl(undefined), null)
})

test('card validator schemas accept and sanitize the location field', () => {
  const validCreate = createCardSchema.parse({
    name: 'Ada Lovelace',
    location: 'London, UK',
  })
  assert.equal(validCreate.location, 'London, UK')

  // Whitespace-only location becomes null
  const emptyLocation = createCardSchema.parse({
    name: 'Charles Babbage',
    location: '   ',
  })
  assert.equal(emptyLocation.location, null)

  // Location exceeds limit
  const tooLongLocation = createCardSchema.safeParse({
    name: 'Grace Hopper',
    location: 'A'.repeat(121),
  })
  assert.equal(tooLongLocation.success, false)

  // Update schema preserves location
  const validUpdate = updateCardSchema.parse({
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    name: 'Katherine Johnson',
    location: 'Hampton, Virginia',
  })
  assert.equal(validUpdate.location, 'Hampton, Virginia')
})

test('extraction schemas include location for AI structured autofill', () => {
  const schema = createExtractionJsonSchema([])
  assert.ok(schema.required.includes('location'))
  assert.deepEqual(schema.properties.location, { type: ['string', 'null'] })

  const parsed = extractedCardSchema.parse({
    name: 'Linus Torvalds',
    company: 'Linux Foundation',
    phone: '+1 555-0199',
    email: 'torvalds@linuxfoundation.org',
    location: 'Portland, OR',
    categoryId: null,
  })
  assert.equal(parsed.location, 'Portland, OR')
})
