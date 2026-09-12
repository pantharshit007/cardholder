'use client'

import { useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { deleteCategory } from '@/server/categories'
import type { CategoryListItem } from '@/types/category'
import { formatCardCount } from '@/utils/format'

export function DeleteCategoryDialog({
  category,
  onClose,
}: {
  category: CategoryListItem | null
  onClose: () => void
}) {
  const router = useRouter()
  const deleteCategoryFn = useServerFn(deleteCategory)
  const [pending, setPending] = useState(false)

  function handleOpenChange(open: boolean) {
    if (pending) {
      return
    }
    if (!open) {
      onClose()
    }
  }

  async function handleDelete() {
    if (!category) {
      return
    }

    setPending(true)

    try {
      const result = await deleteCategoryFn({ data: { id: category.id } })

      if (!result.ok) {
        toast.error(result.error)
        setPending(false)
        return
      }

      await router.invalidate()
      toast.success(`Removed ${result.data.name}.`)
      setPending(false)
      onClose()
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Could not delete the category.'
      toast.error(message)
      setPending(false)
    }
  }

  return (
    <Dialog open={category !== null} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton={!pending}>
        <DialogHeader>
          <DialogTitle>Delete this category?</DialogTitle>
          <DialogDescription>
            {category
              ? category.cardCount > 0
                ? `${category.name} is assigned to ${formatCardCount(category.cardCount)}. Deleting this category will not delete those cards; they will become uncategorized.`
                : `${category.name} has no cards. Only the category will be deleted.`
              : null}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={pending}
            onClick={() => void handleDelete()}
            className="active:scale-[0.98]"
          >
            {pending ? 'Deleting' : 'Delete category'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
