import { Link, createFileRoute, notFound } from '@tanstack/react-router'
import { ArrowLeftIcon } from 'lucide-react'

import { CardForm } from '@/components/card-form'
import { CardFormSkeleton } from '@/components/card-form-skeleton'
import { NotFound } from '@/components/not-found'
import { cardIdSchema } from '@/lib/validators/card'
import { getCard } from '@/server/cards'
import { listCategories } from '@/server/categories'

export const Route = createFileRoute('/_authenticated/cards/$id/edit')({
  loader: async ({ params }) => {
    if (!cardIdSchema.safeParse(params.id).success) {
      throw notFound()
    }

    const [card, categories] = await Promise.all([
      getCard({ data: { id: params.id } }),
      listCategories(),
    ])
    if (!card) {
      throw notFound()
    }
    return { card, categories }
  },
  pendingComponent: CardFormSkeleton,
  notFoundComponent: NotFound,
  component: EditCardRoute,
})

function EditCardRoute() {
  const { card, categories } = Route.useLoaderData()

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-16 md:px-8">
      <div className="pt-4 lg:pt-8">
        <Link
          to="/cards/$id"
          params={{ id: card.id }}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeftIcon className="size-4" />
          Back to card
        </Link>
      </div>

      <section className="animate-rise mt-6">
        <p className="font-mono text-xs tracking-[0.18em] text-primary uppercase">
          Edit Card
        </p>
        <h1 className="mt-2 font-display text-4xl leading-[0.95] tracking-tight text-foreground sm:text-5xl">
          Edit Business Card
        </h1>
        <p className="mt-3 text-sm text-muted-foreground sm:text-base">
          Update contact details or replace the card image.
        </p>
      </section>

      <section className="mt-8 rounded-2xl border border-foreground/10 bg-card p-6 shadow-xs sm:p-8">
        <CardForm card={card} categories={categories} />
      </section>
    </main>
  )
}
