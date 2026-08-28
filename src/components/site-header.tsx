import { Link } from '@tanstack/react-router'
import { ThemeToggle } from '@/components/theme-toggle'
import { APP_NAME } from '@/constants'

export function SiteHeader() {
  return (
    <header className="flex items-center justify-between gap-4 px-4 py-5 md:px-8">
      <Link
        to="/"
        className="font-display text-lg tracking-tight text-foreground"
      >
        {APP_NAME}
      </Link>
      <ThemeToggle />
    </header>
  )
}
