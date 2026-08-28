import type { InferInsertModel, InferSelectModel } from 'drizzle-orm'

import type { cards } from '@/db/schema'

export type Card = InferSelectModel<typeof cards>
export type NewCard = InferInsertModel<typeof cards>
