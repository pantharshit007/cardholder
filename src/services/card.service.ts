import { and, asc, desc, eq, ilike, isNull, or } from 'drizzle-orm'

import { db } from '@/db'
import {
  cardImageUploads,
  cards,
  categories,
  cloudinaryCleanupJobs,
} from '@/db/schema'
import { discardCardImageUploadForUser } from '@/services/card-upload.service'
import { processCloudinaryCleanupJobs } from '@/services/cloudinary-cleanup.service'
import type {
  Card,
  CardListItem,
  CardRecord,
  ListCardsFilter,
} from '@/types/card'
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
  imageUploadId?: string | null
}): Promise<CardRecord> {
  let createdRecord: CardRecord

  try {
    createdRecord = await db.transaction(async (tx) => {
      let selectedCategory: { name: string; color: string | null } | null = null

      if (input.categoryId) {
        const [category] = await tx
          .select({ name: categories.name, color: categories.color })
          .from(categories)
          .where(
            and(
              eq(categories.id, input.categoryId),
              eq(categories.userId, input.userId),
            ),
          )
          .limit(1)

        if (!category) {
          throw new Error('The selected category does not exist.')
        }

        selectedCategory = category
      }

      const [upload] = input.imageUploadId
        ? await tx
            .select({
              imageUrl: cardImageUploads.imageUrl,
              imagePublicId: cardImageUploads.imagePublicId,
            })
            .from(cardImageUploads)
            .where(
              and(
                eq(cardImageUploads.id, input.imageUploadId),
                eq(cardImageUploads.userId, input.userId),
                isNull(cardImageUploads.claimedAt),
              ),
            )
            .limit(1)
        : []

      if (input.imageUploadId && !upload) {
        throw new Error('The image upload is invalid or has expired.')
      }

      const [created] = await tx
        .insert(cards)
        .values({
          userId: input.userId,
          name: input.name,
          phone: input.phone ?? null,
          email: input.email ?? null,
          company: input.company ?? null,
          notes: input.notes ?? null,
          categoryId: input.categoryId ?? null,
          imageUrl: upload?.imageUrl ?? null,
          imagePublicId: upload?.imagePublicId ?? null,
        })
        .returning()

      if (!created) {
        throw new Error('Failed to create the card.')
      }

      if (input.imageUploadId) {
        const [claimed] = await tx
          .update(cardImageUploads)
          .set({ claimedAt: new Date() })
          .where(
            and(
              eq(cardImageUploads.id, input.imageUploadId),
              eq(cardImageUploads.userId, input.userId),
              isNull(cardImageUploads.claimedAt),
            ),
          )
          .returning()

        if (!claimed) {
          throw new Error('The image upload has already been used.')
        }
      }

      return toCardRecord(created, selectedCategory)
    })
  } catch (error) {
    if (input.imageUploadId) {
      await discardUploadAfterFailedPersistence(
        input.userId,
        input.imageUploadId,
      )
    }
    throw error
  }

  return createdRecord
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
  imageUploadId?: string | null
  removeImage?: boolean
}): Promise<CardRecord | null> {
  let updatedRecord: CardRecord | null

  try {
    updatedRecord = await db.transaction(async (tx) => {
      const [existing] = await tx
        .select({
          id: cards.id,
          imageUrl: cards.imageUrl,
          imagePublicId: cards.imagePublicId,
        })
        .from(cards)
        .where(and(eq(cards.id, input.id), eq(cards.userId, input.userId)))
        .limit(1)

      if (!existing) {
        return null
      }

      let selectedCategory: { name: string; color: string | null } | null = null

      if (input.categoryId) {
        const [category] = await tx
          .select({ name: categories.name, color: categories.color })
          .from(categories)
          .where(
            and(
              eq(categories.id, input.categoryId),
              eq(categories.userId, input.userId),
            ),
          )
          .limit(1)

        if (!category) {
          throw new Error('The selected category does not exist.')
        }

        selectedCategory = category
      }

      const [upload] = input.imageUploadId
        ? await tx
            .select({
              imageUrl: cardImageUploads.imageUrl,
              imagePublicId: cardImageUploads.imagePublicId,
            })
            .from(cardImageUploads)
            .where(
              and(
                eq(cardImageUploads.id, input.imageUploadId),
                eq(cardImageUploads.userId, input.userId),
                isNull(cardImageUploads.claimedAt),
              ),
            )
            .limit(1)
        : []

      if (input.imageUploadId && !upload) {
        throw new Error('The image upload is invalid or has expired.')
      }

      const imageUrl = upload
        ? upload.imageUrl
        : input.removeImage
          ? null
          : existing.imageUrl
      const imagePublicId = upload
        ? upload.imagePublicId
        : input.removeImage
          ? null
          : existing.imagePublicId

      const [updated] = await tx
        .update(cards)
        .set({
          name: input.name,
          phone: input.phone ?? null,
          email: input.email ?? null,
          company: input.company ?? null,
          notes: input.notes ?? null,
          categoryId: input.categoryId ?? null,
          imageUrl,
          imagePublicId,
        })
        .where(and(eq(cards.id, input.id), eq(cards.userId, input.userId)))
        .returning()

      if (!updated) {
        return null
      }

      if (existing.imagePublicId && existing.imagePublicId !== imagePublicId) {
        await tx
          .insert(cloudinaryCleanupJobs)
          .values({ imagePublicId: existing.imagePublicId })
          .onConflictDoNothing({ target: cloudinaryCleanupJobs.imagePublicId })
      }

      if (input.imageUploadId) {
        const [claimed] = await tx
          .update(cardImageUploads)
          .set({ claimedAt: new Date() })
          .where(
            and(
              eq(cardImageUploads.id, input.imageUploadId),
              eq(cardImageUploads.userId, input.userId),
              isNull(cardImageUploads.claimedAt),
            ),
          )
          .returning()

        if (!claimed) {
          throw new Error('The image upload has already been used.')
        }
      }

      return toCardRecord(updated, selectedCategory)
    })
  } catch (error) {
    if (input.imageUploadId) {
      await discardUploadAfterFailedPersistence(
        input.userId,
        input.imageUploadId,
      )
    }
    throw error
  }

  if (!updatedRecord) {
    if (input.imageUploadId) {
      await discardUploadAfterFailedPersistence(
        input.userId,
        input.imageUploadId,
      )
    }
    return null
  }

  await processCleanupBestEffort()

  return updatedRecord
}

export async function deleteCardForUser(input: {
  userId: string
  id: string
}): Promise<CardRecord | null> {
  const existing = await getCardForUser(input.userId, input.id)
  if (!existing) {
    return null
  }

  const deleted = await db.transaction(async (tx) => {
    const [current] = await tx
      .select({ imagePublicId: cards.imagePublicId })
      .from(cards)
      .where(and(eq(cards.id, input.id), eq(cards.userId, input.userId)))
      .limit(1)
      .for('update')

    if (!current) {
      return false
    }

    if (current.imagePublicId) {
      await tx
        .insert(cloudinaryCleanupJobs)
        .values({ imagePublicId: current.imagePublicId })
        .onConflictDoNothing({ target: cloudinaryCleanupJobs.imagePublicId })
    }

    await tx
      .delete(cards)
      .where(and(eq(cards.id, input.id), eq(cards.userId, input.userId)))

    return true
  })

  if (!deleted) {
    return null
  }

  await processCleanupBestEffort()

  return existing
}

async function discardUploadAfterFailedPersistence(
  userId: string,
  imageUploadId: string,
): Promise<void> {
  try {
    await discardCardImageUploadForUser({ userId, id: imageUploadId })
  } catch (error) {
    console.warn('Failed to queue unused image cleanup:', error)
  }
}

async function processCleanupBestEffort(): Promise<void> {
  try {
    await processCloudinaryCleanupJobs()
  } catch (error) {
    console.warn('Failed to process Cloudinary cleanup queue:', error)
  }
}

function toCardRecord(
  card: Card,
  category: { name: string; color: string | null } | null,
): CardRecord {
  return {
    id: card.id,
    userId: card.userId,
    name: card.name,
    phone: card.phone,
    email: card.email,
    company: card.company,
    notes: card.notes,
    categoryId: card.categoryId,
    categoryName: category?.name ?? null,
    categoryColor: category?.color ?? null,
    imageUrl: card.imageUrl,
    imagePublicId: card.imagePublicId,
    createdAt: card.createdAt.toISOString(),
    updatedAt: card.updatedAt.toISOString(),
  }
}
