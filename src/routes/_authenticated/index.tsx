import { createFileRoute } from '@tanstack/react-router'

import { CardsPage } from '@/components/cards-page'
import { CardsPageSkeleton } from '@/components/cards-page-skeleton'
import { listCards } from '@/server/cards'
import { listCategories } from '@/server/categories'

export const Route = createFileRoute('/_authenticated/')({
  loader: async () => {
    const [cards, categories] = await Promise.all([
      listCards(),
      listCategories(),
    ])
    return { cards, categories }
  },
  pendingComponent: CardsPageSkeleton,
  component: AuthenticatedHome,
})

function AuthenticatedHome() {
  const { cards, categories } = Route.useLoaderData()
  return <CardsPage cards={cards} categories={categories} />
}
