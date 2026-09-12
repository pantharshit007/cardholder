import { and, asc, desc, eq, ilike, isNull, or } from 'drizzle-orm'

import { db } from '@/db'
import { cards, categories } from '@/db/schema'
import { deleteCloudinaryImage } from '@/services/cloudinary'
import type { CardListItem, CardRecord, ListCardsFilter } from '@/types/card'
import type { CategoryColorHex } from '@/utils/category-color'

export async function listCardsForUser(
  userId: string,
  filter?: ListCardsFilter,
): Promise<CardListItem[]> {
  const conditions = [eq(cards.userId, userId)]

  if (filter?.categoryId && filter.categoryId !== 'all') {
    if (filter.categoryId === 'uncategorized') {
      conditions.push(isNull(cards.categoryId))
    } else {
      conditions.push(eq(cards.categoryId, filter.categoryId))
    }
  }

  if (filter?.search && filter.search.trim().length > 0) {
    const pattern = `%${filter.search.trim()}%`
    conditions.push(
      or(
        ilike(cards.name, pattern),
        ilike(cards.phone, pattern),
        ilike(cards.company, pattern),
      )!,
    )
  }

  let orderByClause = desc(cards.createdAt)
  if (filter?.sort === 'oldest') {
    orderByClause = asc(cards.createdAt)
  } else if (filter?.sort === 'name_asc') {
    orderByClause = asc(cards.name)
  } else if (filter?.sort === 'name_desc') {
    orderByClause = desc(cards.name)
  }

  const rows = await db
    .select({
      id: cards.id,
      userId: cards.userId,
      name: cards.name,
      phone: cards.phone,
      email: cards.email,
      company: cards.company,
      notes: cards.notes,
      categoryId: cards.categoryId,
      categoryName: categories.name,
      categoryColor: categories.color,
      imageUrl: cards.imageUrl,
      imagePublicId: cards.imagePublicId,
      createdAt: cards.createdAt,
      updatedAt: cards.updatedAt,
    })
    .from(cards)
    .leftJoin(categories, eq(cards.categoryId, categories.id))
    .where(and(...conditions))
    .orderBy(orderByClause)

  return rows.map((row) => ({
    id: row.id,
    userId: row.userId,
    name: row.name,
    phone: row.phone,
    email: row.email,
    company: row.company,
    notes: row.notes,
    categoryId: row.categoryId,
    categoryName: row.categoryName,
    categoryColor: row.categoryColor as CategoryColorHex | null,
    imageUrl: row.imageUrl,
    imagePublicId: row.imagePublicId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }))
}

export async function getCardForUser(
  userId: string,
  id: string,
): Promise<CardRecord | null> {
  const [row] = await db
    .select({
      id: cards.id,
      userId: cards.userId,
      name: cards.name,
      phone: cards.phone,
      email: cards.email,
      company: cards.company,
      notes: cards.notes,
      categoryId: cards.categoryId,
      categoryName: categories.name,
      categoryColor: categories.color,
      imageUrl: cards.imageUrl,
      imagePublicId: cards.imagePublicId,
      createdAt: cards.createdAt,
      updatedAt: cards.updatedAt,
    })
    .from(cards)
    .leftJoin(categories, eq(cards.categoryId, categories.id))
    .where(and(eq(cards.id, id), eq(cards.userId, userId)))
    .limit(1)

  if (!row) {
    return null
  }

  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    phone: row.phone,
    email: row.email,
    company: row.company,
    notes: row.notes,
    categoryId: row.categoryId,
    categoryName: row.categoryName,
    categoryColor: row.categoryColor as CategoryColorHex | null,
    imageUrl: row.imageUrl,
    imagePublicId: row.imagePublicId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

export async function createCardForUser(input: {
  userId: string
  name: string
  phone?: string | null
  email?: string | null
  company?: string | null
  notes?: string | null
  categoryId?: string | null
  imageUrl?: string | null
  imagePublicId?: string | null
}): Promise<CardRecord> {
  if (input.categoryId) {
    const [cat] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(
        and(
          eq(categories.id, input.categoryId),
          eq(categories.userId, input.userId),
        ),
      )
      .limit(1)

    if (!cat) {
      throw new Error('The selected category does not exist.')
    }
  }

  const [created] = await db
    .insert(cards)
    .values({
      userId: input.userId,
      name: input.name,
      phone: input.phone ?? null,
      email: input.email ?? null,
      company: input.company ?? null,
      notes: input.notes ?? null,
      categoryId: input.categoryId ?? null,
      imageUrl: input.imageUrl ?? null,
      imagePublicId: input.imagePublicId ?? null,
    })
    .returning()

  if (!created) {
    throw new Error('Failed to create the card.')
  }

  const record = await getCardForUser(input.userId, created.id)
  if (!record) {
    throw new Error('Card was created but could not be retrieved.')
  }

  return record
}

export async function updateCardForUser(input: {
  userId: string
  id: string
  name: string
  phone?: string | null
  email?: string | null
  company?: string | null
  notes?: string | null
  categoryId?: string | null
  imageUrl?: string | null
  imagePublicId?: string | null
}): Promise<CardRecord | null> {
  const existing = await getCardForUser(input.userId, input.id)
  if (!existing) {
    return null
  }

  if (input.categoryId) {
    const [cat] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(
        and(
          eq(categories.id, input.categoryId),
          eq(categories.userId, input.userId),
        ),
      )
      .limit(1)

    if (!cat) {
      throw new Error('The selected category does not exist.')
    }
  }

  // If replacing image with a new public ID, clean up the old one
  if (
    existing.imagePublicId &&
    input.imagePublicId &&
    existing.imagePublicId !== input.imagePublicId
  ) {
    void deleteCloudinaryImage(existing.imagePublicId)
  }

  await db
    .update(cards)
    .set({
      name: input.name,
      phone: input.phone ?? null,
      email: input.email ?? null,
      company: input.company ?? null,
      notes: input.notes ?? null,
      categoryId: input.categoryId ?? null,
      imageUrl: input.imageUrl ?? null,
      imagePublicId: input.imagePublicId ?? null,
    })
    .where(and(eq(cards.id, input.id), eq(cards.userId, input.userId)))

  return getCardForUser(input.userId, input.id)
}

export async function deleteCardForUser(input: {
  userId: string
  id: string
}): Promise<CardRecord | null> {
  const existing = await getCardForUser(input.userId, input.id)
  if (!existing) {
    return null
  }

  await db
    .delete(cards)
    .where(and(eq(cards.id, input.id), eq(cards.userId, input.userId)))

  if (existing.imagePublicId) {
    void deleteCloudinaryImage(existing.imagePublicId)
  }

  return existing
}
