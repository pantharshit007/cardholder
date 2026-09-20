import type { PublicUser } from '@/types/auth'

export type NavigationSessionValue = { user: PublicUser } | null

export type NavigationSession = {
  get: () => Promise<NavigationSessionValue>
  clear: () => void
}

export type RouterContext = {
  navigationSession: NavigationSession
}
