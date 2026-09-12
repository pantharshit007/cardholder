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
import { deleteCard } from '@/server/cards'
import type { CardRecord } from '@/types/card'

export function DeleteCardDialog({
  card,
  open,
  onOpenChange,
  onDeleted,
}: {
  card: CardRecord | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeleted?: () => void
}) {
  const router = useRouter()
  const deleteCardFn = useServerFn(deleteCard)
  const [pending, setPending] = useState(false)

  function handleOpenChange(nextOpen: boolean) {
    if (pending) {
      return
    }
    onOpenChange(nextOpen)
  }

  async function handleDelete() {
    if (!card) {
      return
    }

    setPending(true)

    try {
      const result = await deleteCardFn({ data: { id: card.id } })

      if (!result.ok) {
        toast.error(result.error)
        setPending(false)
        return
      }

      await router.invalidate()
      toast.success(`Deleted ${result.data.name}.`)
      setPending(false)
      onOpenChange(false)
      onDeleted?.()
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Could not delete the card.'
      toast.error(message)
      setPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton={!pending}>
        <DialogHeader>
          <DialogTitle>Delete this card?</DialogTitle>
          <DialogDescription>
            {card ? (
              <>
                Are you sure you want to delete{' '}
                <span className="font-semibold text-foreground">
                  {card.name}
                </span>
                ? This action cannot be undone, and the associated image will be
                removed.
              </>
            ) : null}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => onOpenChange(false)}
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
            {pending ? 'Deleting...' : 'Delete card'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
