import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'

import { AppShell } from '@/components/app-shell'
import { LOGIN_PATH } from '@/constants'
import { fetchSession } from '@/server/session'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({ location }) => {
    const session = await fetchSession()
    if (!session?.user) {
      throw redirect({
        to: LOGIN_PATH,
        search: {
          redirect: location.href,
        },
      })
    }

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
