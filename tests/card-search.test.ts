import assert from 'node:assert/strict'
import { test } from 'node:test'

import { CARD_CONFIG } from '@/constants'
import { cardListSearchSchema, listCardsSchema } from '@/lib/validators/card'
import { escapeLikePattern } from '@/utils/search'

test('bookmarks preserve combined filters and discard invalid fields independently', () => {
  const filters = {
    search: ' john ',
    categoryId: 'uncategorized',
    sort: 'oldest',
  }
  assert.deepEqual(cardListSearchSchema.parse(filters), {
    ...filters,
    search: 'john',
  })
  assert.deepEqual(
    cardListSearchSchema.parse({
      search: 'john',
      categoryId: 'broken',
      sort: 'wrong',
    }),
    {
      search: 'john',
      categoryId: undefined,
      sort: undefined,
    },
  )
})

test('RPC rejects invalid categories, unbounded searches and invalid pagination', () => {
  for (const input of [
    { categoryId: 'broken' },
    { search: 'x'.repeat(CARD_CONFIG.searchMaxLength + 1) },
    { limit: 0 },
    { limit: CARD_CONFIG.maxPageSize + 1 },
    { offset: -1 },
  ]) {
    assert.equal(listCardsSchema.safeParse(input).success, false)
  }
  assert.equal(
    listCardsSchema.safeParse({
      search: '123',
      categoryId: 'all',
      sort: 'name_asc',
      limit: CARD_CONFIG.pageSize,
      offset: 0,
    }).success,
    true,
  )
})

test('search treats percent, underscore and backslash as literal characters', () => {
  assert.equal(escapeLikePattern('100%_\\'), '100\\%\\_\\\\')
  assert.equal(escapeLikePattern('john 123'), 'john 123')
})
