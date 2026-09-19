import { and, eq, isNull } from 'drizzle-orm'

import { db } from '@/db'
import { cardImageUploads, cloudinaryCleanupJobs } from '@/db/schema'
import { processCloudinaryCleanupJobs } from '@/services/cloudinary-cleanup.service'
import type { CardImageUpload } from '@/types/card-upload'

export async function createCardImageUploadForUser(input: {
  userId: string
  imageUrl: string
  imagePublicId: string
}): Promise<CardImageUpload> {
  const [upload] = await db.insert(cardImageUploads).values(input).returning()

  if (!upload) {
    throw new Error('Failed to record the image upload.')
  }

  return upload
}

export async function discardCardImageUploadForUser(input: {
  userId: string
  id: string
}): Promise<boolean> {
  const queued = await db.transaction(async (tx) => {
    const [upload] = await tx
      .select({ imagePublicId: cardImageUploads.imagePublicId })
      .from(cardImageUploads)
      .where(
        and(
          eq(cardImageUploads.id, input.id),
          eq(cardImageUploads.userId, input.userId),
          isNull(cardImageUploads.claimedAt),
        ),
      )
      .limit(1)

    if (!upload) {
      return false
    }

    await tx
      .insert(cloudinaryCleanupJobs)
      .values({ imagePublicId: upload.imagePublicId })
      .onConflictDoNothing({ target: cloudinaryCleanupJobs.imagePublicId })

    await tx
      .delete(cardImageUploads)
      .where(
        and(
          eq(cardImageUploads.id, input.id),
          eq(cardImageUploads.userId, input.userId),
          isNull(cardImageUploads.claimedAt),
        ),
      )

    return true
  })

  if (queued) {
    await processCloudinaryCleanupJobs()
  }

  return queued
}
