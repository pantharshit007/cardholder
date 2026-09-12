'use client'

import { CategoryColorSwatches } from '@/components/category-color-swatches'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { FIELD_LIMITS } from '@/constants'
import type { CategoryColorHex } from '@/utils/category-color'

export function CategoryFormFields({
  nameId,
  name,
  color,
  nameError,
  formError,
  disabled,
  autoFocus,
  onNameChange,
  onColorChange,
}: {
  nameId: string
  name: string
  color: CategoryColorHex | null
  nameError?: string
  formError?: string
  disabled?: boolean
  autoFocus?: boolean
  onNameChange: (value: string) => void
  onColorChange: (value: CategoryColorHex | null) => void
}) {
  return (
    <FieldGroup>
      <Field data-invalid={nameError ? true : undefined}>
        <FieldLabel htmlFor={nameId}>Name</FieldLabel>
        <Input
          id={nameId}
          name="name"
          value={name}
          maxLength={FIELD_LIMITS.categoryName}
          disabled={disabled}
          autoFocus={autoFocus}
          onChange={(event) => onNameChange(event.target.value)}
          className="bg-card"
          autoComplete="off"
          aria-invalid={nameError ? true : undefined}
        />
        <FieldError>{nameError}</FieldError>
      </Field>
      <Field>
        <FieldLabel>Color</FieldLabel>
        <CategoryColorSwatches
          value={color}
          onChange={onColorChange}
          disabled={disabled}
        />
      </Field>
      {formError ? <FieldError>{formError}</FieldError> : null}
    </FieldGroup>
  )
}
