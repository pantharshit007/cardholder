'use client'

import { useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import { toast } from 'sonner'

import { CategoryFormFields } from '@/components/category-form-fields'
import { Button } from '@/components/ui/button'
import { CATEGORY_ROW_STAGGER_MS } from '@/constants'
import { updateCategorySchema } from '@/lib/validators/category'
import { updateCategory } from '@/server/categories'
import type { CategoryListItem } from '@/types/category'
import type { CategoryColorHex } from '@/utils/category-color'
import { categoryStripeColor, isCategoryColorHex } from '@/utils/category-color'
import { formatCardCount } from '@/utils/format'

function toColorValue(color: string | null): CategoryColorHex | null {
  if (color && isCategoryColorHex(color)) {
    return color
  }
  return null
}

export function CategoryRow({
  category,
  index,
  editing,
  onStartEdit,
  onCancelEdit,
  onRequestDelete,
}: {
  category: CategoryListItem
  index: number
  editing: boolean
  onStartEdit: () => void
  onCancelEdit: () => void
  onRequestDelete: () => void
}) {
  if (editing) {
    return (
      <li className="relative py-4 pl-5">
        <ColorStripe color={category.color} />
        <CategoryEditForm category={category} onCancel={onCancelEdit} />
      </li>
    )
  }

  return (
    <li
      className="relative flex animate-rise flex-col gap-3 py-4 pl-5 sm:flex-row sm:items-center sm:justify-between"
      style={{ animationDelay: `${index * CATEGORY_ROW_STAGGER_MS}ms` }}
    >
      <ColorStripe color={category.color} />
      <div className="min-w-0">
        <p className="font-display text-2xl leading-none tracking-tight">
          {category.name}
        </p>
        <p className="mt-2 font-mono text-xs tracking-wide text-muted-foreground">
          {formatCardCount(category.cardCount)}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onStartEdit}
          className="active:scale-[0.98]"
        >
          Rename
        </Button>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={onRequestDelete}
          className="active:scale-[0.98]"
        >
          Delete
        </Button>
      </div>
    </li>
  )
}

function CategoryEditForm({
  category,
  onCancel,
}: {
  category: CategoryListItem
  onCancel: () => void
}) {
  const router = useRouter()
  const updateCategoryFn = useServerFn(updateCategory)
  const nameInputId = `edit-category-name-${category.id}`
  const [name, setName] = useState(category.name)
  const [color, setColor] = useState<CategoryColorHex | null>(
    toColorValue(category.color),
  )
  const [pending, setPending] = useState(false)
  const [nameError, setNameError] = useState<string | undefined>()
  const [formError, setFormError] = useState<string | undefined>()

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const parsed = updateCategorySchema.safeParse({
      id: category.id,
      name,
      color,
    })

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
      const result = await updateCategoryFn({
        data: {
          id: parsed.data.id,
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
      toast.success(`Updated ${result.data.name}.`)
      onCancel()
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Could not update the category.'
      setFormError(message)
      toast.error(message)
      setPending(false)
    }
  }

  return (
    <form
      onSubmit={(event) => void handleSubmit(event)}
      noValidate
      className="max-w-lg"
    >
      <CategoryFormFields
        nameId={nameInputId}
        name={name}
        color={color}
        nameError={nameError}
        formError={formError}
        disabled={pending}
        autoFocus
        onNameChange={setName}
        onColorChange={setColor}
      />
      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          type="submit"
          size="sm"
          disabled={pending}
          className="active:scale-[0.98]"
        >
          {pending ? 'Saving' : 'Save'}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={onCancel}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}

function ColorStripe({ color }: { color: string | null }) {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-y-2 left-0 w-1.5 rounded-full"
      style={{ backgroundColor: categoryStripeColor(color) }}
    />
  )
}
