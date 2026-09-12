import { createFileRoute, notFound } from '@tanstack/react-router'

import { CardDetailPage } from '@/components/card-detail-page'
import { CardDetailSkeleton } from '@/components/card-detail-skeleton'
import { NotFound } from '@/components/not-found'
import { getCard } from '@/server/cards'

export const Route = createFileRoute('/_authenticated/cards/$id/')({
  loader: async ({ params }) => {
    const card = await getCard({ data: { id: params.id } })
    if (!card) {
      throw notFound()
    }
    return { card }
  },
  pendingComponent: CardDetailSkeleton,
  notFoundComponent: NotFound,
  component: CardDetailRoute,
})

function CardDetailRoute() {
  const { card } = Route.useLoaderData()
  return <CardDetailPage card={card} />
}
