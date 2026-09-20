import type { CardListItem } from '@/types/card'
import type { CategoryListItem } from '@/types/category'

export type CardsPageData = {
  cards: CardListItem[]
  categories: CategoryListItem[]
}
