import { asc, eq, sql } from 'drizzle-orm'

import { CLOUDINARY_CLEANUP_BATCH_SIZE } from '@/constants'
import { db } from '@/db'
import { cloudinaryCleanupJobs } from '@/db/schema'
import { deleteCloudinaryImage } from '@/services/cloudinary'

export async function processCloudinaryCleanupJobs(): Promise<void> {
  const jobs = await db
    .select({
      id: cloudinaryCleanupJobs.id,
      imagePublicId: cloudinaryCleanupJobs.imagePublicId,
    })
    .from(cloudinaryCleanupJobs)
    .orderBy(asc(cloudinaryCleanupJobs.createdAt))
    .limit(CLOUDINARY_CLEANUP_BATCH_SIZE)

  await Promise.all(
    jobs.map(async (job) => {
      const deleted = await deleteCloudinaryImage(job.imagePublicId)

      if (deleted) {
        await db
          .delete(cloudinaryCleanupJobs)
          .where(eq(cloudinaryCleanupJobs.id, job.id))
        return
      }

      await db
        .update(cloudinaryCleanupJobs)
        .set({
          attempts: sql`${cloudinaryCleanupJobs.attempts} + 1`,
          lastAttemptAt: new Date(),
          lastError: 'Cloudinary deletion failed.',
        })
        .where(eq(cloudinaryCleanupJobs.id, job.id))
    }),
  )
}
