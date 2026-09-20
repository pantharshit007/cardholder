import { createServerFn } from '@tanstack/react-start'

import { requireUser } from '@/lib/require-user'
import { listCardsSchema } from '@/lib/validators/card'
import { listCardsForUser } from '@/services/card.service'
import { listCategoriesWithCounts } from '@/services/category.service'
import type { CardsPageData } from '@/types/cards-page'

export const fetchCardsPage = createServerFn({ method: 'GET' })
  .validator((input?: unknown) => listCardsSchema.optional().parse(input))
  .handler(async ({ data }): Promise<CardsPageData> => {
    const user = await requireUser()
    const [cards, categories] = await Promise.all([
      listCardsForUser(user.id, data),
      listCategoriesWithCounts(user.id),
    ])
    return { cards, categories }
  })
