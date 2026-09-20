import { redirect } from '@tanstack/react-router'

import { AUTH_CONFIG, NAV_PATHS } from '@/constants'
import type { PublicUser } from '@/types/auth'

export function requireVerifiedEmail(user: Pick<PublicUser, 'emailVerified'>) {
  if (user.emailVerified !== true) {
    throw redirect({ to: NAV_PATHS.verificationPending })
  }
}

export function emailVerificationFailure(
  user: Pick<PublicUser, 'emailVerified'>,
): Response | null {
  if (user.emailVerified === true) return null
  return Response.json(
    { message: AUTH_CONFIG.verificationPendingMessage },
    { status: 403, headers: { 'Cache-Control': 'no-store' } },
  )
}

export function requireAdminRole(user: Pick<PublicUser, 'isAdmin'>) {
  if (user.isAdmin !== true) throw redirect({ to: NAV_PATHS.cards })
}
