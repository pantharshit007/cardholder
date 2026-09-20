import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'

import { requireVerifiedEmail } from '@/lib/verified-user'
import { AppShell } from '@/components/app-shell'
import { LOGIN_PATH } from '@/constants'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({ location, context }) => {
    const session = await context.navigationSession.get()
    if (!session?.user) {
      throw redirect({
        to: LOGIN_PATH,
        search: {
          redirect: location.href,
        },
      })
    }

    requireVerifiedEmail(session.user)
    return { user: session.user }
  },
  component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
  const { user } = Route.useRouteContext()

  return (
    <AppShell user={user}>
      <Outlet />
    </AppShell>
  )
}
