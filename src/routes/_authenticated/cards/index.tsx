import { createFileRoute } from '@tanstack/react-router'

import { CardsPage } from '@/components/cards-page'
import { CardsPageSkeleton } from '@/components/cards-page-skeleton'
import { cardListSearchSchema } from '@/lib/validators/card'
import { listCards } from '@/server/cards'
import { listCategories } from '@/server/categories'

export const Route = createFileRoute('/_authenticated/cards/')({
  validateSearch: (search) => cardListSearchSchema.parse(search),
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => {
    const [cards, categories] = await Promise.all([
      listCards({ data: deps }),
      listCategories(),
    ])
    return { cards, categories }
  },
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
