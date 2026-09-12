import { Skeleton } from '@/components/ui/skeleton'

export function CategoriesPageSkeleton() {
  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-16 md:px-8">
      <section className="max-w-3xl pt-4 lg:pt-10">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="mt-6 h-14 w-64 max-w-full" />
        <Skeleton className="mt-6 h-16 w-full max-w-xl" />
      </section>
      <section className="mt-12 max-w-3xl divide-y divide-foreground/10 border-y border-foreground/10">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="flex items-center justify-between py-4">
            <div className="space-y-2">
              <Skeleton className="h-7 w-36" />
              <Skeleton className="h-3 w-16" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-7 w-16" />
              <Skeleton className="h-7 w-16" />
            </div>
          </div>
        ))}
      </section>
    </main>
  )
}
