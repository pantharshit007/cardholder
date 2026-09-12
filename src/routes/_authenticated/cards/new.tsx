import { Link, createFileRoute } from '@tanstack/react-router'
import { ArrowLeftIcon } from 'lucide-react'

import { CardForm } from '@/components/card-form'
import { CARDS_PATH } from '@/constants'
import { listCategories } from '@/server/categories'

export const Route = createFileRoute('/_authenticated/cards/new')({
  loader: () => listCategories(),
  component: CreateCardRoute,
})

function CreateCardRoute() {
  const categories = Route.useLoaderData()

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-16 md:px-8">
      <div className="pt-4 lg:pt-8">
        <Link
          to={CARDS_PATH}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeftIcon className="size-4" />
          Back to all cards
        </Link>
      </div>

      <section className="animate-rise mt-6">
        <p className="font-mono text-xs tracking-[0.18em] text-primary uppercase">
          New Card
        </p>
        <h1 className="mt-2 font-display text-4xl leading-[0.95] tracking-tight text-foreground sm:text-5xl">
          Add Business Card
        </h1>
        <p className="mt-3 text-sm text-muted-foreground sm:text-base">
          Enter contact details and optionally upload an image of the physical
          card.
        </p>
      </section>

      <section className="mt-8 rounded-2xl border border-foreground/10 bg-card p-6 shadow-xs sm:p-8">
        <CardForm categories={categories} />
      </section>
    </main>
  )
}
