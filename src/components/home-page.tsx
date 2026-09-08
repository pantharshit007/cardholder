import { SampleCardStack } from '@/components/sample-card-stack'
import { APP_NAME } from '@/constants'
import type { PublicUser } from '@/types/auth'

export function HomePage({ user }: { user: PublicUser }) {
  return (
    <main className="mx-auto grid w-full max-w-7xl flex-1 grid-cols-1 items-start gap-12 px-4 pb-16 md:px-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-16 lg:pt-6">
      <section className="animate-rise pt-4 lg:pt-10">
        <p className="font-mono text-xs tracking-[0.18em] text-primary uppercase">
          Locked case
        </p>
        <h1 className="mt-4 max-w-[16ch] font-display text-5xl leading-[0.92] tracking-tight text-foreground md:text-6xl">
          {user.name}, the tray is waiting.
        </h1>
        <p className="mt-6 max-w-[52ch] text-base leading-relaxed text-muted-foreground">
          This case is locked to {user.email}. When you start filing cards,
          they will live here — name, phone, category, and a photo of the
          original.
        </p>
      </section>
      <SampleCardStack />
    </main>
  )
}
