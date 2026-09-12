'use client'

import { useState } from 'react'

import { AddCategoryDialog } from '@/components/add-category-dialog'
import { CategoryList } from '@/components/category-list'
import { DeleteCategoryDialog } from '@/components/delete-category-dialog'
import { Button } from '@/components/ui/button'
import type { CategoryListItem } from '@/types/category'

export function CategoriesPage({
  categories,
}: {
  categories: CategoryListItem[]
}) {
  const [addOpen, setAddOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<CategoryListItem | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)

  function requestDelete(category: CategoryListItem) {
    setDeleting(category)
    setDeleteOpen(true)
  }

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-16 md:px-8">
      <section className="animate-rise max-w-3xl pt-4 lg:pt-10">
        <p className="font-mono text-xs tracking-[0.18em] text-primary uppercase">
          Categories
        </p>
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="max-w-[14ch] font-display text-5xl leading-[0.92] tracking-tight text-foreground md:text-6xl">
              Organize your cards.
            </h1>
            <p className="mt-6 max-w-[52ch] text-base leading-relaxed text-muted-foreground">
              Create categories to group related cards. Deleting a category
              never deletes its cards.
            </p>
          </div>
          {categories.length > 0 ? (
            <Button
              type="button"
              onClick={() => setAddOpen(true)}
              className="w-fit shrink-0 active:scale-[0.98]"
            >
              Add category
            </Button>
          ) : null}
        </div>
      </section>

      <section className="mt-12 max-w-3xl">
        <CategoryList
          categories={categories}
          editingId={editingId}
          onStartEdit={setEditingId}
          onCancelEdit={() => setEditingId(null)}
          onRequestDelete={requestDelete}
          onAdd={() => setAddOpen(true)}
        />
      </section>

      <AddCategoryDialog open={addOpen} onOpenChange={setAddOpen} />
      <DeleteCategoryDialog
        category={deleting}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </main>
  )
}
