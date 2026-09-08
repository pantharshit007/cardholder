import { createFileRoute, redirect } from '@tanstack/react-router'

import { SignupPage } from '@/components/signup-page'
import { DEFAULT_POST_AUTH_PATH, LOGIN_PATH } from '@/constants'
import { fetchAuthSettings, fetchSession } from '@/server/session'

export const Route = createFileRoute('/signup')({
  beforeLoad: async () => {
    const session = await fetchSession()
    if (session?.user) {
      throw redirect({ to: DEFAULT_POST_AUTH_PATH })
    }

    const settings = await fetchAuthSettings()
    if (!settings.allowSignup) {
      throw redirect({ to: LOGIN_PATH })
    }
  },
  component: SignupPage,
})
