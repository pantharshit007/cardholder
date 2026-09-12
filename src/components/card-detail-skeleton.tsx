import { Skeleton } from '@/components/ui/skeleton'

export function CardDetailSkeleton() {
  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-16 md:px-8">
      <div className="flex items-center justify-between pt-4 lg:pt-8">
        <Skeleton className="h-4 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-20" />
        </div>
      </div>

      <section className="mt-6 space-y-3">
        <Skeleton className="h-5 w-24 rounded-full" />
        <Skeleton className="h-12 w-72" />
        <Skeleton className="h-5 w-48" />
      </section>

      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-7">
          <Skeleton className="aspect-[16/10] w-full rounded-2xl" />
        </div>

        <div className="space-y-6 lg:col-span-5">
          <div className="rounded-2xl border border-foreground/10 bg-card p-6 space-y-4">
            <Skeleton className="h-3 w-36" />
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
          </div>

          <div className="rounded-2xl border border-foreground/10 bg-card p-6 space-y-3">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-20 w-full rounded-lg" />
          </div>
        </div>
      </div>
    </main>
  )
}
