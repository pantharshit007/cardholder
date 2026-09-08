import { createFileRoute, redirect } from '@tanstack/react-router'

import { LoginPage } from '@/components/login-page'
import { DEFAULT_POST_AUTH_PATH } from '@/constants'
import { fetchAuthSettings, fetchSession } from '@/server/session'
import type { LoginSearch } from '@/types/auth'

function parseLoginSearch(search: Record<string, unknown>): LoginSearch {
  return {
    redirect: typeof search.redirect === 'string' ? search.redirect : undefined,
  }
}

export const Route = createFileRoute('/login')({
  validateSearch: parseLoginSearch,
  beforeLoad: async () => {
    const session = await fetchSession()
    if (session?.user) {
      throw redirect({ to: DEFAULT_POST_AUTH_PATH })
    }
  },
  loader: async () => {
    return fetchAuthSettings()
  },
  component: LoginRoute,
})

function LoginRoute() {
  const { allowSignup } = Route.useLoaderData()
  const { redirect: redirectTo } = Route.useSearch()

  return <LoginPage allowSignup={allowSignup} redirectTo={redirectTo} />
}
