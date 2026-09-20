import { useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'

import { GuestShell } from '@/components/guest-shell'
import { SignOutButton } from '@/components/sign-out-button'
import { Button } from '@/components/ui/button'
import { AUTH_CONFIG } from '@/constants'
import type { PublicUser } from '@/types/auth'

export function VerificationPendingPage({ user }: { user: PublicUser }) {
  const router = useRouter()
  const [checking, setChecking] = useState(false)

  async function checkStatus() {
    setChecking(true)
    try {
      await router.invalidate()
    } catch {
      toast.error('Could not check verification status. Please try again.')
    } finally {
      setChecking(false)
    }
  }

  return (
    <GuestShell>
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-4 py-16">
        <h1 className="font-display text-4xl tracking-tight">
          Email verification pending
        </h1>
        <p className="mt-4 text-muted-foreground">
          {AUTH_CONFIG.verificationPendingMessage}
        </p>
        <p className="mt-3 break-all text-sm">Signed in as {user.email}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button disabled={checking} onClick={() => void checkStatus()}>
            {checking ? 'Checking…' : 'Check verification status'}
          </Button>
          <SignOutButton />
        </div>
        <p role="status" className="mt-4 text-sm text-muted-foreground">
          {checking
            ? 'Checking your email verification…'
            : 'Your email has not been verified yet.'}
        </p>
      </main>
    </GuestShell>
  )
}
