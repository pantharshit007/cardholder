import { createFileRoute, redirect } from '@tanstack/react-router'

import { VerificationPendingPage } from '@/components/verification-pending-page'
import { NAV_PATHS } from '@/constants'
import { fetchSession } from '@/server/session'

export const Route = createFileRoute('/verification-pending')({
  beforeLoad: async () => {
    const session = await fetchSession()
    if (!session?.user) throw redirect({ to: NAV_PATHS.login })
    if (session.user.emailVerified === true) {
      throw redirect({ to: NAV_PATHS.defaultPostAuth })
    }
    return { user: session.user }
  },
  component: PendingRoute,
})

function PendingRoute() {
  const { user } = Route.useRouteContext()
  return <VerificationPendingPage user={user} />
}
