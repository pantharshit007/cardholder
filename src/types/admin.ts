import type { ADMIN_CONFIG } from '@/constants'

export type AdminUserFilter = {
  status?: (typeof ADMIN_CONFIG.statuses)[number]
  after?: string
}
export type AdminUserListItem = {
  id: string
  name: string
  email: string
  emailVerified: boolean
  isAdmin: boolean
}
export type AdminUserPage = {
  users: AdminUserListItem[]
  nextCursor: string | null
}
