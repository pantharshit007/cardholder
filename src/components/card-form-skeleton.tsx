import { Skeleton } from '@/components/ui/skeleton'

export function CardFormSkeleton() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-16 md:px-8">
      <div className="pt-4 lg:pt-8">
        <Skeleton className="h-5 w-32" />
      </div>

      <section className="mt-6">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="mt-3 h-12 w-72 max-w-full" />
        <Skeleton className="mt-3 h-4 w-96 max-w-full" />
      </section>

      <section className="mt-8 space-y-8 rounded-2xl border border-foreground/10 bg-card p-6 shadow-xs sm:p-8">
        <Skeleton className="h-56 w-full rounded-xl" />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Skeleton className="h-16 sm:col-span-2" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-28 sm:col-span-2" />
        </div>
      </section>
    </main>
  )
}
