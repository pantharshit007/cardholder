import type { PublicUser } from '@/types/auth'

export function toPublicUser(user: {
  id: string
  name: string
  isAdmin: boolean
  emailVerified: boolean
  email: string
  image?: string | null
}): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    emailVerified: user.emailVerified,
    isAdmin: user.isAdmin,
    image: user.image ?? null,
  }
}

export function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean).slice(0, 2)

  return parts.map((part) => part.charAt(0).toUpperCase()).join('')
}
