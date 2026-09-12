import { Link } from '@tanstack/react-router'

import { SampleCardStack } from '@/components/sample-card-stack'
import { Button } from '@/components/ui/button'
import { CATEGORIES_PATH } from '@/constants'
import type { PublicUser } from '@/types/auth'

export function HomePage({ user }: { user: PublicUser }) {
  return (
    <main className="mx-auto grid w-full max-w-7xl flex-1 grid-cols-1 items-start gap-12 px-4 pb-16 md:px-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-16 lg:pt-6">
      <section className="animate-rise pt-4 lg:pt-10">
        <p className="font-mono text-xs tracking-[0.18em] text-primary uppercase">
          Your cards
        </p>
        <h1 className="mt-4 max-w-[16ch] font-display text-5xl leading-[0.92] tracking-tight text-foreground md:text-6xl">
          {user.name}, your collection is ready.
        </h1>
        <p className="mt-6 max-w-[52ch] text-base leading-relaxed text-muted-foreground">
          Signed in as {user.email}. Your saved business cards will appear here
          with their contact details, category, and original image.
        </p>
        <Button asChild className="mt-8 active:scale-[0.98]">
          <Link to={CATEGORIES_PATH}>Manage categories</Link>
        </Button>
      </section>
      <SampleCardStack />
    </main>
  )
}
