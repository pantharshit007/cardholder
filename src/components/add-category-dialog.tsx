'use client'

import { useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import { toast } from 'sonner'

import { CategoryFormFields } from '@/components/category-form-fields'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { createCategorySchema } from '@/lib/validators/category'
import { createCategory } from '@/server/categories'
import type { CategoryColorHex } from '@/utils/category-color'

export function AddCategoryDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const createCategoryFn = useServerFn(createCategory)
  const [name, setName] = useState('')
  const [color, setColor] = useState<CategoryColorHex | null>(null)
  const [pending, setPending] = useState(false)
  const [nameError, setNameError] = useState<string | undefined>()
  const [formError, setFormError] = useState<string | undefined>()

  function reset() {
    setName('')
    setColor(null)
    setNameError(undefined)
    setFormError(undefined)
    setPending(false)
  }

  function handleOpenChange(next: boolean) {
    if (pending) {
      return
    }
    if (!next) {
      reset()
    }
    onOpenChange(next)
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const parsed = createCategorySchema.safeParse({ name, color })

    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors
      setNameError(fieldErrors.name?.[0])
      setFormError(undefined)
      return
    }

    setNameError(undefined)
    setFormError(undefined)
    setPending(true)

    try {
      const result = await createCategoryFn({
        data: {
          name: parsed.data.name,
          color: parsed.data.color ?? null,
        },
      })

      if (!result.ok) {
        if (result.code === 'duplicate') {
          setNameError(result.error)
        } else {
          setFormError(result.error)
        }
        toast.error(result.error)
        setPending(false)
        return
      }

      await router.invalidate()
      toast.success(`Added ${result.data.name}.`)
      reset()
      onOpenChange(false)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Could not add the category.'
      setFormError(message)
      toast.error(message)
      setPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton={!pending}>
        <form
          className="contents"
          onSubmit={(event) => void handleSubmit(event)}
          noValidate
        >
          <DialogHeader>
            <DialogTitle>Add category</DialogTitle>
            <DialogDescription>
              Use categories to group related cards.
            </DialogDescription>
          </DialogHeader>
          <CategoryFormFields
            nameId="add-category-name"
            name={name}
            color={color}
            nameError={nameError}
            formError={formError}
            disabled={pending}
            autoFocus
            onNameChange={setName}
            onColorChange={setColor}
          />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={pending}
              className="active:scale-[0.98]"
            >
              {pending ? 'Adding' : 'Add category'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
