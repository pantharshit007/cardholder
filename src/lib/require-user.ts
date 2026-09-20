import { redirect } from '@tanstack/react-router'
import { getRequest } from '@tanstack/react-start/server'

import { LOGIN_PATH } from '@/constants'
import { getRequestSession } from '@/lib/session'
import { requireVerifiedEmail } from '@/lib/verified-user'

export async function getCurrentSession() {
  return getRequestSession(getRequest().headers)
}

export async function requireUser() {
  const session = await getCurrentSession()
  const user = session?.user

  if (!user) {
    throw redirect({ to: LOGIN_PATH })
  }

  requireVerifiedEmail(user)
  return user
}
