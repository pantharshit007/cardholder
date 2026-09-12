import { Link } from '@tanstack/react-router'

import { SignOutButton } from '@/components/sign-out-button'
import { ThemeToggle } from '@/components/theme-toggle'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { APP_NAME, CATEGORIES_PATH } from '@/constants'
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
      <header className="flex items-center justify-between gap-2 px-4 py-5 sm:gap-4 md:px-8">
        <div className="flex min-w-0 items-center gap-2 sm:gap-5 md:gap-8">
          <Link
            to="/"
            className="font-display text-sm tracking-tight text-foreground sm:text-lg"
          >
            {APP_NAME}
          </Link>
          <nav className="flex items-center gap-2 text-sm sm:gap-4">
            <Link
              to="/"
              activeOptions={{ exact: true }}
              className="transition-colors hover:text-foreground"
              inactiveProps={{ className: 'text-muted-foreground' }}
              activeProps={{ className: 'text-foreground' }}
            >
              Cards
            </Link>
            <Link
              to={CATEGORIES_PATH}
              className="transition-colors hover:text-foreground"
              inactiveProps={{ className: 'text-muted-foreground' }}
              activeProps={{ className: 'text-foreground' }}
            >
              Categories
            </Link>
          </nav>
        </div>
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
