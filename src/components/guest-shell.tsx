import { SiteHeader } from '@/components/site-header'

export function GuestShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[100dvh] flex-col">
      <SiteHeader />
      {children}
    </div>
  )
}
