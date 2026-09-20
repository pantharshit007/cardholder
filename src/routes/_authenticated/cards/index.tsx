import { createFileRoute } from '@tanstack/react-router'

import { CardsPage } from '@/components/cards-page'
import { CardsPageSkeleton } from '@/components/cards-page-skeleton'
import { cardListSearchSchema } from '@/lib/validators/card'
import { fetchCardsPage } from '@/server/cards-page'

export const Route = createFileRoute('/_authenticated/cards/')({
  validateSearch: (search) => cardListSearchSchema.parse(search),
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => fetchCardsPage({ data: deps }),
  pendingComponent: CardsPageSkeleton,
  component: AuthenticatedCardsRoute,
})

function AuthenticatedCardsRoute() {
  const { cards, categories } = Route.useLoaderData()
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  return (
    <CardsPage
      cards={cards}
      categories={categories}
      filters={search}
      onFiltersChange={(next, replace = false) => {
        void navigate({ search: next, replace, resetScroll: false })
      }}
    />
  )
}
