import { FooterCredit } from '@/components/footer-credit'
import { SiteHeader } from '@/components/site-header'

export function GuestShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[100dvh] flex-col">
      <SiteHeader />
      <div className="flex flex-1 flex-col">{children}</div>
      <footer className="mt-auto border-t border-foreground/10 px-4 py-4 md:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-end">
          <FooterCredit />
        </div>
      </footer>
    </div>
  )
}
