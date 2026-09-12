/**
 * One-off Phase 4 acceptance check for user scoping, duplicates, and FK set-null.
 * Not part of the app; run with `pnpm exec tsx --env-file=.env scripts/category-scope-check.ts`
 */
import { eq } from 'drizzle-orm'

import { db } from '../src/db'
import { cards, categories, user } from '../src/db/schema'
import {
  DuplicateCategoryError,
  createCategoryForUser,
  deleteCategoryForUser,
  listCategoriesWithCounts,
  updateCategoryForUser,
} from '../src/services/category.service'

async function main() {
  const users = await db.select({ id: user.id, email: user.email }).from(user)
  const first = users[0]
  const second = users[1]

  if (!first || !second) {
    throw new Error('Need two users in the database for this check.')
  }

  const stamp = Date.now()
  const sharedName = `Scope ${stamp}`

  const a = await createCategoryForUser({
    userId: first.id,
    name: sharedName,
    color: '#6B4F3A',
  })
  const b = await createCategoryForUser({
    userId: second.id,
    name: sharedName,
    color: '#A15C38',
  })

  let duplicateCaught = false
  try {
    await createCategoryForUser({
      userId: first.id,
      name: sharedName,
      color: null,
    })
  } catch (error) {
    duplicateCaught = error instanceof DuplicateCategoryError
    if (!duplicateCaught) {
      throw error
    }
  }

  const aList = await listCategoriesWithCounts(first.id)
  const bList = await listCategoriesWithCounts(second.id)
  const aSeesB = aList.some((row) => row.id === b.id)
  const bSeesA = bList.some((row) => row.id === a.id)

  const stolen = await updateCategoryForUser({
    userId: first.id,
    id: b.id,
    name: `Stolen ${stamp}`,
    color: null,
  })

  const [card] = await db
    .insert(cards)
    .values({
      userId: first.id,
      name: `Card ${stamp}`,
      categoryId: a.id,
    })
    .returning()

  if (!card) {
    throw new Error('Could not insert a card for the FK check.')
  }

  const deleted = await deleteCategoryForUser({
    userId: first.id,
    id: a.id,
  })
  const [cardAfter] = await db
    .select({ categoryId: cards.categoryId })
    .from(cards)
    .where(eq(cards.id, card.id))

  const deletedForeign = await deleteCategoryForUser({
    userId: first.id,
    id: b.id,
  })

  await db.delete(cards).where(eq(cards.id, card.id))
  await db.delete(categories).where(eq(categories.id, b.id))

  const report = {
    duplicateCaught,
    aSeesB,
    bSeesA,
    stolenIsNull: stolen === null,
    deletedOwn: deleted !== null,
    cardCategoryCleared: cardAfter?.categoryId === null,
    deletedForeignIsNull: deletedForeign === null,
  }

  console.log(report)

  const failed = Object.entries(report).filter(([key, value]) => {
    if (key === 'aSeesB' || key === 'bSeesA') {
      return value !== false
    }
    if (key === 'stolenIsNull' || key === 'deletedForeignIsNull') {
      return value !== true
    }
    return value !== true
  })

  if (failed.length > 0) {
    throw new Error(`Scope check failed: ${failed.map(([key]) => key).join(', ')}`)
  }
}

main()
  .then(() => {
    console.log('category scope check ok')
    process.exit(0)
  })
  .catch((error: unknown) => {
    console.error('category scope check failed:', error)
    process.exit(1)
  })
