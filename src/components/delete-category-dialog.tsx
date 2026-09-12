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
        error instanceof Error ? error.message : 'Could not remove the drawer.'
      toast.error(message)
      setPending(false)
    }
  }

  return (
    <Dialog open={category !== null} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton={!pending}>
        <DialogHeader>
          <DialogTitle>Remove this drawer?</DialogTitle>
          <DialogDescription>
            {category
              ? category.cardCount > 0
                ? `${category.name} currently marks ${formatCardCount(category.cardCount)}. Those cards stay in the case; they just lose this tab.`
                : `${category.name} is empty. Removing it will not touch any cards.`
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
            Keep it
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={pending}
            onClick={() => void handleDelete()}
            className="active:scale-[0.98]"
          >
            {pending ? 'Removing' : 'Remove drawer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
