import { createFileRoute } from '@tanstack/react-router'

import { HomePage } from '@/components/home-page'

export const Route = createFileRoute('/_authenticated/')({
  component: AuthenticatedHome,
})

function AuthenticatedHome() {
  const { user } = Route.useRouteContext()
  return <HomePage user={user} />
}
