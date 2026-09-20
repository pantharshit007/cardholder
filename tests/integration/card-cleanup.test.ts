import assert from 'node:assert/strict'
import { after, before, beforeEach, test } from 'node:test'
import { eq, sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { Pool } from 'pg'

import { db } from '@/db'
import {
  cards,
  cardImageUploads,
  cloudinaryCleanupJobs,
  user,
} from '@/db/schema'
import { env } from '@/env'
import { updateCardForUser } from '@/services/card.service'
import { IMAGE_UPLOAD_CONFIG } from '@/constants'

// Run explicitly against a disposable cardholder_test_* database with dummy
// Cloudinary credentials. Every provider request is intercepted below.
const pool = db.$client
assert.ok(pool instanceof Pool)
assert.ok(new URL(env.DATABASE_URL).pathname.startsWith('/cardholder_test_'))
const originalFetch = globalThis.fetch
const deletedIds: string[] = []
const userId = 'cleanup-test-user'
const imageUrl = (id: string) =>
  `https://res.cloudinary.com/test/image/upload/v1/${id}.jpg`

before(async () => {
  await migrate(drizzle(pool), { migrationsFolder: 'drizzle' })
  await db
    .insert(user)
    .values({ id: userId, name: 'Test', email: 'cleanup@example.com' })
})
beforeEach(async () => {
  await db.execute(
    sql`truncate cards, card_image_uploads, cloudinary_cleanup_jobs`,
  )
  deletedIds.length = 0
  globalThis.fetch = async (_url, options) => {
    assert.ok(options?.body instanceof FormData)
    assert.ok(options.signal instanceof AbortSignal)
    deletedIds.push(String(options.body.get('public_id')))
    return Response.json({ result: 'ok' })
  }
})
after(async () => {
  globalThis.fetch = originalFetch
  await pool.end()
})

async function legacyCard() {
  const [card] = await db
    .insert(cards)
    .values({
      userId,
      name: 'Original',
      imageUrl: imageUrl('legacy'),
    })
    .returning()
  assert.ok(card)
  return card
}

async function upload(id: string) {
  const [row] = await db
    .insert(cardImageUploads)
    .values({
      userId,
      imagePublicId: id,
      imageUrl: imageUrl(id),
    })
    .returning()
  assert.ok(row)
  return row
}

test('text edits retain legacy images without deleting or queuing them', async () => {
  const card = await legacyCard()
  const updated = await updateCardForUser({
    userId,
    id: card.id,
    name: 'Edited',
  })
  assert.equal(updated?.imageUrl, card.imageUrl)
  assert.equal(updated.imagePublicId, null)
  assert.deepEqual(deletedIds, [])
  assert.deepEqual(await db.select().from(cloudinaryCleanupJobs), [])
})

test('removing a legacy image deletes its URL-derived asset', async () => {
  const card = await legacyCard()
  const updated = await updateCardForUser({
    userId,
    id: card.id,
    name: card.name,
    removeImage: true,
  })
  assert.equal(updated?.imageUrl, null)
  assert.deepEqual(deletedIds, ['legacy'])
})

test('replacing a legacy image deletes only the previous asset', async () => {
  const card = await legacyCard()
  const replacement = await upload('replacement')
  const updated = await updateCardForUser({
    userId,
    id: card.id,
    name: card.name,
    imageUploadId: replacement.id,
  })
  assert.equal(updated?.imagePublicId, 'replacement')
  assert.deepEqual(deletedIds, ['legacy'])
})

test('concurrent replacements clean up both superseded images', async () => {
  const card = await legacyCard()
  const first = await upload('first')
  const second = await upload('second')
  await Promise.all(
    [first, second].map((replacement) =>
      updateCardForUser({
        userId,
        id: card.id,
        name: card.name,
        imageUploadId: replacement.id,
      }),
    ),
  )
  const [saved] = await db.select().from(cards).where(eq(cards.id, card.id))
  assert.ok(saved)
  const superseded = saved.imagePublicId === 'first' ? 'second' : 'first'
  assert.ok(deletedIds.includes('legacy'))
  assert.ok(deletedIds.includes(superseded))
  assert.ok(!deletedIds.includes(saved.imagePublicId!))
  const remaining = await db.select().from(cardImageUploads)
  assert.deepEqual(
    remaining.map((row) => row.imagePublicId),
    [saved.imagePublicId],
  )
})

test('timed-out deletion preserves the cleanup job after saving the card', async (t) => {
  const card = await legacyCard()
  t.mock.method(AbortSignal, 'timeout', (duration: number) => {
    assert.equal(duration, IMAGE_UPLOAD_CONFIG.cloudinaryDeletionTimeoutMs)
    return AbortSignal.abort(new DOMException('Timed out', 'TimeoutError'))
  })
  t.mock.method(console, 'warn', () => {})
  globalThis.fetch = async (_url, options) => {
    options?.signal?.throwIfAborted()
    throw new Error('Expected an aborted signal')
  }
  const updated = await updateCardForUser({
    userId,
    id: card.id,
    name: card.name,
    removeImage: true,
  })
  assert.equal(updated?.imageUrl, null)
  const jobs = await db.select().from(cloudinaryCleanupJobs)
  assert.equal(jobs.length, 1)
  assert.equal(jobs[0]?.imagePublicId, 'legacy')
})
