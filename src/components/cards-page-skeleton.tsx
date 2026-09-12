import { Skeleton } from '@/components/ui/skeleton'

export function CardsPageSkeleton() {
  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-16 md:px-8">
      <section className="max-w-3xl pt-4 lg:pt-10">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="mt-3 h-12 w-64 max-w-full" />
        <Skeleton className="mt-3 h-4 w-48" />
      </section>

      <section className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Skeleton className="h-10 flex-1 rounded-lg" />
        <Skeleton className="h-10 w-full sm:w-44 rounded-lg" />
        <Skeleton className="h-10 w-full sm:w-36 rounded-lg" />
      </section>

      <section className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => (
          <div
            key={index}
            className="flex flex-col overflow-hidden rounded-xl border border-foreground/10 bg-card"
          >
            <Skeleton className="aspect-[16/10] w-full" />
            <div className="p-4 space-y-3">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-3.5 w-1/2" />
              <div className="pt-2 border-t border-foreground/10 space-y-2">
                <Skeleton className="h-3 w-2/3" />
                <Skeleton className="h-3 w-4/5" />
              </div>
            </div>
          </div>
        ))}
      </section>
    </main>
  )
}
