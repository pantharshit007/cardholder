import { redirect } from '@tanstack/react-router'
import { getRequest } from '@tanstack/react-start/server'

import { LOGIN_PATH } from '@/constants'
import { auth } from '@/lib/auth'

export async function getCurrentSession() {
  return auth.api.getSession({
    headers: getRequest().headers,
  })
}

export async function requireUser() {
  const session = await getCurrentSession()
  const user = session?.user

  if (!user) {
    throw redirect({ to: LOGIN_PATH })
  }

  return user
}
