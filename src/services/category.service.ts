import { and, asc, count, eq } from 'drizzle-orm'

import { db } from '@/db'
import { cards, categories } from '@/db/schema'
import type {
  Category,
  CategoryListItem,
  CategoryRecord,
} from '@/types/category'
import { isUniqueViolation } from '@/utils/postgres-error'

export class DuplicateCategoryError extends Error {
  constructor() {
    super('A drawer with that name already exists.')
    this.name = 'DuplicateCategoryError'
  }
}

function toCategoryRecord(row: Category): CategoryRecord {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

function toCardCount(value: number | string): number {
  return typeof value === 'number' ? value : Number(value)
}

export async function listCategoriesWithCounts(
  userId: string,
): Promise<CategoryListItem[]> {
  const rows = await db
    .select({
      id: categories.id,
      name: categories.name,
      color: categories.color,
      createdAt: categories.createdAt,
      updatedAt: categories.updatedAt,
      cardCount: count(cards.id),
    })
    .from(categories)
    .leftJoin(
      cards,
      and(eq(cards.categoryId, categories.id), eq(cards.userId, userId)),
    )
    .where(eq(categories.userId, userId))
    .groupBy(categories.id)
    .orderBy(asc(categories.name))

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    color: row.color,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    cardCount: toCardCount(row.cardCount),
  }))
}

export async function createCategoryForUser(input: {
  userId: string
  name: string
  color: string | null
}): Promise<CategoryRecord> {
  try {
    const [created] = await db
      .insert(categories)
      .values({
        userId: input.userId,
        name: input.name,
        color: input.color,
      })
      .returning()

    if (!created) {
      throw new Error('Could not create the category.')
    }

    return toCategoryRecord(created)
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new DuplicateCategoryError()
    }

    throw error
  }
}

export async function updateCategoryForUser(input: {
  userId: string
  id: string
  name: string
  color: string | null
}): Promise<CategoryRecord | null> {
  try {
    const [updated] = await db
      .update(categories)
      .set({
        name: input.name,
        color: input.color,
      })
      .where(
        and(eq(categories.id, input.id), eq(categories.userId, input.userId)),
      )
      .returning()

    return updated ? toCategoryRecord(updated) : null
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new DuplicateCategoryError()
    }

    throw error
  }
}

export async function deleteCategoryForUser(input: {
  userId: string
  id: string
}): Promise<CategoryRecord | null> {
  const [deleted] = await db
    .delete(categories)
    .where(
      and(eq(categories.id, input.id), eq(categories.userId, input.userId)),
    )
    .returning()

  return deleted ? toCategoryRecord(deleted) : null
}
