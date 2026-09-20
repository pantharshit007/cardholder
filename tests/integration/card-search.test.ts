import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { Pool } from 'pg'

import { db } from '@/db'
import { cards, categories, user } from '@/db/schema'
import { env } from '@/env'
import { listCardsForUser } from '@/services/card.service'

const pool = db.$client
assert.ok(pool instanceof Pool)
assert.ok(new URL(env.DATABASE_URL).pathname.startsWith('/cardholder_test_'))
const owner = 'search-owner'
const other = 'search-other'
let categoryId: string

before(async () => {
  await migrate(drizzle(pool), { migrationsFolder: 'drizzle' })
  await db.insert(user).values([
    { id: owner, name: 'Owner', email: 'search-owner@example.com' },
    { id: other, name: 'Other', email: 'search-other@example.com' },
  ])
  const [category] = await db
    .insert(categories)
    .values({ userId: owner, name: 'Work' })
    .returning()
  assert.ok(category)
  categoryId = category.id
  await db.insert(cards).values([
    {
      userId: owner,
      name: 'John Alpha',
      phone: '555-1234',
      categoryId,
      createdAt: new Date('2026-01-01'),
    },
    {
      userId: owner,
      name: 'John Beta',
      phone: '555-9876',
      categoryId,
      createdAt: new Date('2026-02-01'),
    },
    { userId: owner, name: '100%_literal', createdAt: new Date('2026-03-01') },
    { userId: other, name: 'John Private', phone: '555-1234' },
  ])
})
after(async () => {
  await pool.end()
})

test('server combines case-insensitive name/phone search, categories, sort and user scope', async () => {
  const result = await listCardsForUser(owner, {
    search: 'JOHN',
    categoryId,
    sort: 'oldest',
  })
  assert.deepEqual(
    result.map((card) => card.name),
    ['John Alpha', 'John Beta'],
  )
  assert.deepEqual(
    (await listCardsForUser(owner, { search: '1234' })).map(
      (card) => card.name,
    ),
    ['John Alpha'],
  )
  assert.deepEqual(
    (await listCardsForUser(other, { categoryId })).map((card) => card.name),
    [],
  )
  assert.deepEqual(
    (
      await listCardsForUser(owner, {
        categoryId: 'uncategorized',
        search: '%_',
      })
    ).map((card) => card.name),
    ['100%_literal'],
  )
  assert.deepEqual(
    (
      await listCardsForUser(owner, {
        search: 'john',
        sort: 'name_asc',
        limit: 1,
        offset: 1,
      })
    ).map((card) => card.name),
    ['John Beta'],
  )
  assert.deepEqual(
    (await listCardsForUser(owner, { search: 'john' })).map(
      (card) => card.name,
    ),
    ['John Beta', 'John Alpha'],
  )
})
