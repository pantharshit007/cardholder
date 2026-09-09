'use client'

import { useNavigate, useRouter } from '@tanstack/react-router'
import { LogOut } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { LOGIN_PATH } from '@/constants'
import { authClient } from '@/lib/auth-client'
import { authErrorMessage } from '@/utils/auth-error'

export function SignOutButton() {
  const router = useRouter()
  const navigate = useNavigate()
  const [pending, setPending] = useState(false)

  async function handleSignOut() {
    setPending(true)
    const { error } = await authClient.signOut()
    if (error) {
      toast.error(authErrorMessage(error, 'Could not sign out.'))
      setPending(false)
      return
    }

    await router.invalidate()
    await navigate({ to: LOGIN_PATH, replace: true })
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={() => void handleSignOut()}
      disabled={pending}
      className="active:scale-[0.98]"
    >
      <LogOut />
      {pending ? 'Signing out' : 'Sign out'}
    </Button>
  )
}
