import { z } from 'zod'
import { ADMIN_CONFIG } from '@/constants'

const userId = z.string().min(1).max(ADMIN_CONFIG.userIdMaxLength)
export const adminUserFilterSchema = z.object({
  status: z.enum(ADMIN_CONFIG.statuses).optional(),
  after: userId.optional(),
})
export const approveUserSchema = z.object({ id: userId })
