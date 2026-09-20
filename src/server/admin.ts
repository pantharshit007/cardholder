import { createServerFn } from '@tanstack/react-start'

import { requireAdmin } from '@/lib/require-admin'
import {
  adminUserFilterSchema,
  approveUserSchema,
} from '@/lib/validators/admin'
import { approveUserById, listAdminUsers } from '@/services/admin-user.service'
import type { AdminUserPage } from '@/types/admin'

export const fetchAdminUsers = createServerFn({ method: 'GET' })
  .validator((input: unknown) => adminUserFilterSchema.parse(input))
  .handler(async ({ data }): Promise<AdminUserPage> => {
    await requireAdmin()
    return listAdminUsers(data)
  })

export const approveUser = createServerFn({ method: 'POST' })
  .validator((input: unknown) => approveUserSchema.parse(input))
  .handler(async ({ data }): Promise<{ approved: boolean }> => {
    await requireAdmin()
    return { approved: await approveUserById(data.id) }
  })
