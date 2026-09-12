'use client'

import { CategoriesEmptyState } from '@/components/categories-empty-state'
import { CategoryRow } from '@/components/category-row'
import type { CategoryListItem } from '@/types/category'

export function CategoryList({
  categories,
  editingId,
  onStartEdit,
  onCancelEdit,
  onRequestDelete,
  onAdd,
}: {
  categories: CategoryListItem[]
  editingId: string | null
  onStartEdit: (id: string) => void
  onCancelEdit: () => void
  onRequestDelete: (category: CategoryListItem) => void
  onAdd: () => void
}) {
  if (categories.length === 0) {
    return <CategoriesEmptyState onAdd={onAdd} />
  }

  return (
    <ul className="divide-y divide-foreground/10 border-y border-foreground/10">
      {categories.map((category, index) => (
        <CategoryRow
          key={category.id}
          category={category}
          index={index}
          editing={editingId === category.id}
          onStartEdit={() => onStartEdit(category.id)}
          onCancelEdit={onCancelEdit}
          onRequestDelete={() => onRequestDelete(category)}
        />
      ))}
    </ul>
  )
}
