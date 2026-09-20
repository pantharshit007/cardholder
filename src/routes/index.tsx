import { requireVerifiedEmail } from '@/lib/verified-user'
import { createFileRoute, redirect } from '@tanstack/react-router'

import { LandingPage } from '@/components/landing-page'
import { CARDS_PATH } from '@/constants'
import { fetchAuthSettings, fetchSession } from '@/server/session'

export const Route = createFileRoute('/')({
  beforeLoad: async () => {
    const session = await fetchSession()
    if (session?.user) {
      requireVerifiedEmail(session.user)
      throw redirect({ to: CARDS_PATH })
    }
  },
  loader: async () => {
    return fetchAuthSettings()
  },
  component: LandingRouteComponent,
})

function LandingRouteComponent() {
  const { allowSignup } = Route.useLoaderData()
  return <LandingPage allowSignup={allowSignup} />
}
