import { createServerFn } from '@tanstack/react-start'

import { env } from '@/env'
import { getCurrentSession } from '@/lib/require-user'
import type { AuthSettings, PublicUser } from '@/types/auth'
import { toPublicUser } from '@/utils/auth-user'

export const fetchSession = createServerFn({ method: 'GET' }).handler(
  async (): Promise<{ user: PublicUser } | null> => {
    const session = await getCurrentSession()
    if (!session?.user) {
      return null
    }

    return { user: toPublicUser(session.user) }
  },
)

export const fetchAuthSettings = createServerFn({ method: 'GET' }).handler(
  async (): Promise<AuthSettings> => {
    return { allowSignup: env.ALLOW_SIGNUP }
  },
)
