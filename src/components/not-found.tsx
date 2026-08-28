import { Link } from '@tanstack/react-router'
import { SiteHeader } from '@/components/site-header'
import { Button } from '@/components/ui/button'

export function NotFound() {
  return (
    <div className="flex min-h-[100dvh] flex-col">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center px-4 pb-16 md:px-8">
        <p className="font-mono text-xs tracking-[0.18em] text-primary uppercase">
          404
        </p>
        <h1 className="mt-4 max-w-[12ch] font-display text-5xl leading-none tracking-tight">
          That card is not in the case.
        </h1>
        <p className="mt-4 max-w-[48ch] text-base leading-relaxed text-muted-foreground">
          The URL does not match a route in this app.
        </p>
        <Button asChild className="mt-8 w-fit active:scale-[0.98]">
          <Link to="/">Back to home</Link>
        </Button>
      </main>
    </div>
  )
}
