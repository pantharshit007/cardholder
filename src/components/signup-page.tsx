import { GuestShell } from '@/components/guest-shell'
import { SampleCardStack } from '@/components/sample-card-stack'
import { SignupForm } from '@/components/signup-form'
import { APP_NAME } from '@/constants'

export function SignupPage() {
  return (
    <GuestShell>
      <main className="mx-auto grid w-full max-w-7xl flex-1 grid-cols-1 items-start gap-12 px-4 pb-16 md:px-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-16 lg:pt-6">
        <section className="animate-rise pt-4 lg:pt-10">
          <p className="font-mono text-xs tracking-[0.18em] text-primary uppercase">
            First key
          </p>
          <h1 className="mt-4 max-w-[14ch] font-display text-5xl leading-[0.92] tracking-tight text-foreground md:text-6xl">
            Cut a key for the case.
          </h1>
          <p className="mt-6 max-w-[46ch] text-base leading-relaxed text-muted-foreground">
            {APP_NAME} is built for one person first. Create the account, then
            lock signup if you want the door to stay shut.
          </p>
          <div className="mt-10 max-w-md">
            <SignupForm />
          </div>
        </section>
        <SampleCardStack />
      </main>
    </GuestShell>
  )
}
