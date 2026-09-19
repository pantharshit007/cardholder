import type { InferInsertModel, InferSelectModel } from 'drizzle-orm'

import type { CardSortOption } from '@/constants'
import type { cards } from '@/db/schema'

export type Card = InferSelectModel<typeof cards>
export type NewCard = InferInsertModel<typeof cards>

export type CardRecord = {
  id: string
  userId: string
  name: string
  phone: string | null
  email: string | null
  company: string | null
  notes: string | null
  categoryId: string | null
  categoryName: string | null
  categoryColor: string | null
  imageUrl: string | null
  imagePublicId: string | null
  createdAt: string
  updatedAt: string
}

export type CardListItem = CardRecord

export type ListCardsFilter = {
  search?: string
  categoryId?: string
  sort?: CardSortOption
}
