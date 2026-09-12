import type { InferInsertModel, InferSelectModel } from 'drizzle-orm'

import type { categories } from '@/db/schema'

export type Category = InferSelectModel<typeof categories>
export type NewCategory = InferInsertModel<typeof categories>

export type CategoryRecord = {
  id: string
  name: string
  color: string | null
  createdAt: string
  updatedAt: string
}

export type CategoryListItem = CategoryRecord & {
  cardCount: number
}
