import { Link } from '@tanstack/react-router'
import {
  ArrowRightIcon,
  LayersIcon,
  ScanTextIcon,
  SearchIcon,
  ShieldCheckIcon,
} from 'lucide-react'

import { SampleCardStack } from '@/components/sample-card-stack'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { APP_NAME, LOGIN_PATH, SIGNUP_PATH } from '@/constants'

export function LandingPage({ allowSignup = true }: { allowSignup?: boolean }) {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      {/* Top Header Navigation */}
      <header className="flex items-center justify-between gap-4 px-4 py-5 md:px-8">
        <Link
          to="/"
          className="font-display text-lg tracking-tight text-foreground transition-opacity hover:opacity-80"
        >
          {APP_NAME}
        </Link>
        <div className="flex items-center gap-2.5 sm:gap-3">
          <ThemeToggle />
          <Button asChild variant="ghost" size="sm">
            <Link to={LOGIN_PATH}>Sign in</Link>
          </Button>
          {allowSignup ? (
            <Button asChild size="sm" className="active:scale-[0.98]">
              <Link to={SIGNUP_PATH}>Get started</Link>
            </Button>
          ) : null}
        </div>
      </header>

      {/* Hero Section */}
      <main className="mx-auto grid w-full max-w-7xl flex-1 grid-cols-1 items-center gap-12 px-4 py-8 md:px-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-16 lg:py-16">
        <section className="animate-rise flex flex-col items-start pt-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-foreground/10 bg-muted/40 px-3 py-1 text-xs font-medium text-primary">
            <span className="size-1.5 rounded-full bg-primary" />
            <span>Digital Card Case</span>
          </div>

          <h1 className="mt-4 max-w-[15ch] font-display text-4xl leading-[0.95] font-normal tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl">
            Keep every card you were handed.
          </h1>

          <p className="mt-6 max-w-[50ch] text-base leading-relaxed text-muted-foreground sm:text-lg">
            CardHolder digitizes physical business and visiting cards with
            instant AI-powered scanning, color-coded categories, and searchable
            contact profiles.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            {allowSignup ? (
              <Button asChild size="lg" className="active:scale-[0.98]">
                <Link to={SIGNUP_PATH}>
                  Get started
                  <ArrowRightIcon className="ml-2 size-4" />
                </Link>
              </Button>
            ) : null}
            <Button
              asChild
              variant={allowSignup ? 'outline' : 'default'}
              size="lg"
              className="active:scale-[0.98]"
            >
              <Link to={LOGIN_PATH}>
                {allowSignup ? 'Sign in' : 'Sign in to your card case'}
                {!allowSignup ? (
                  <ArrowRightIcon className="ml-2 size-4" />
                ) : null}
              </Link>
            </Button>
          </div>

          {/* Quick Feature Pillars */}
          <div className="mt-14 grid w-full grid-cols-1 gap-6 border-t border-foreground/10 pt-8 sm:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-primary">
                <ScanTextIcon className="size-4" />
                <h2 className="font-mono text-xs font-semibold tracking-wider uppercase">
                  AI Card OCR
                </h2>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Drop in a photo to automatically extract names, phones, emails,
                and locations.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-primary">
                <LayersIcon className="size-4" />
                <h2 className="font-mono text-xs font-semibold tracking-wider uppercase">
                  Categories
                </h2>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Organize cards into color-coded stacks to group clients,
                vendors, and partners.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-primary">
                <SearchIcon className="size-4" />
                <h2 className="font-mono text-xs font-semibold tracking-wider uppercase">
                  Fast Search
                </h2>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Quickly locate contacts by name, company, notes, or location
                anytime.
              </p>
            </div>
          </div>
        </section>

        {/* Visual Stack Graphic */}
        <div className="relative flex w-full items-center justify-center lg:justify-end">
          <SampleCardStack />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-foreground/10 px-4 py-6 text-center text-xs text-muted-foreground md:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 sm:flex-row">
          <p className="font-display tracking-tight text-foreground/80">
            {APP_NAME} — Private card case
          </p>
          <div className="flex items-center gap-1.5 text-muted-foreground/60">
            <ShieldCheckIcon className="size-3.5" />
            <span>Secure & private storage</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
