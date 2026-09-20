import { requireUser } from '@/lib/require-user'
import { requireAdminRole } from '@/lib/verified-user'

export async function requireAdmin() {
  const user = await requireUser()
  requireAdminRole(user)
  return user
}
