import { and, asc, eq, gt } from 'drizzle-orm'

import { ADMIN_CONFIG } from '@/constants'
import { db } from '@/db'
import { user } from '@/db/schema'
import type { AdminUserFilter, AdminUserPage } from '@/types/admin'

/** Admin-only directory. Callers must authorize with requireAdmin first. */
export async function listAdminUsers(
  filter: AdminUserFilter,
): Promise<AdminUserPage> {
  const status = filter.status ?? 'pending'
  const users = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      isAdmin: user.isAdmin,
    })
    .from(user)
    .where(
      and(
        status === 'all'
          ? undefined
          : eq(user.emailVerified, status === 'approved'),
        filter.after ? gt(user.id, filter.after) : undefined,
      ),
    )
    .orderBy(asc(user.id))
    .limit(ADMIN_CONFIG.pageSize + 1)
  const hasMore = users.length > ADMIN_CONFIG.pageSize
  const page = users.slice(0, ADMIN_CONFIG.pageSize)
  return { users: page, nextCursor: hasMore ? page.at(-1)!.id : null }
}

export async function approveUserById(id: string): Promise<boolean> {
  const [approved] = await db
    .update(user)
    .set({ emailVerified: true })
    .where(and(eq(user.id, id), eq(user.emailVerified, false)))
    .returning()
  return Boolean(approved)
}
