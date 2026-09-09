import { Link } from '@tanstack/react-router'

import { SignOutButton } from '@/components/sign-out-button'
import { ThemeToggle } from '@/components/theme-toggle'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { APP_NAME } from '@/constants'
import type { PublicUser } from '@/types/auth'
import { initialsFromName } from '@/utils/auth-user'

export function AppShell({
  user,
  children,
}: {
  user: PublicUser
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-[100dvh] flex-col">
      <header className="flex items-center justify-between gap-4 px-4 py-5 md:px-8">
        <Link
          to="/"
          className="font-display text-lg tracking-tight text-foreground"
        >
          {APP_NAME}
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden items-center gap-2 sm:flex">
            <Avatar size="sm" className="rounded-md">
              <AvatarFallback className="rounded-md bg-secondary font-display text-[0.65rem]">
                {initialsFromName(user.name)}
              </AvatarFallback>
            </Avatar>
            <span className="max-w-48 truncate text-sm text-muted-foreground">
              {user.email}
            </span>
          </div>
          <SignOutButton />
          <ThemeToggle />
        </div>
      </header>
      {children}
    </div>
  )
}
