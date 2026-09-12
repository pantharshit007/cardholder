import { z } from 'zod'

import {
  CARD_NAME_MIN_LENGTH,
  CARD_SORT_OPTIONS,
  FIELD_LIMITS,
} from '@/constants'

function emptyToNull(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export const cardNameSchema = z
  .string()
  .trim()
  .min(CARD_NAME_MIN_LENGTH, 'Enter a name.')
  .max(
    FIELD_LIMITS.name,
    `Keep it under ${FIELD_LIMITS.name} characters.`,
  )

export const cardPhoneSchema = z
  .preprocess(
    emptyToNull,
    z
      .string()
      .max(
        FIELD_LIMITS.phone,
        `Keep it under ${FIELD_LIMITS.phone} characters.`,
      )
      .nullable(),
  )
  .optional()

export const cardEmailSchema = z
  .preprocess(
    emptyToNull,
    z
      .string()
      .email('Enter a valid email address.')
      .max(
        FIELD_LIMITS.email,
        `Keep it under ${FIELD_LIMITS.email} characters.`,
      )
      .nullable(),
  )
  .optional()

export const cardCompanySchema = z
  .preprocess(
    emptyToNull,
    z
      .string()
      .max(
        FIELD_LIMITS.company,
        `Keep it under ${FIELD_LIMITS.company} characters.`,
      )
      .nullable(),
  )
  .optional()

export const cardNotesSchema = z
  .preprocess(
    emptyToNull,
    z
      .string()
      .max(
        FIELD_LIMITS.notes,
        `Keep it under ${FIELD_LIMITS.notes} characters.`,
      )
      .nullable(),
  )
  .optional()

export const cardCategoryIdSchema = z
  .preprocess(
    (value) => {
      if (!value || value === 'none' || value === 'null') return null
      return emptyToNull(value)
    },
    z.string().uuid('Invalid category ID.').nullable(),
  )
  .optional()

export const cardImageUrlSchema = z
  .preprocess(emptyToNull, z.string().nullable())
  .optional()

export const cardImagePublicIdSchema = z
  .preprocess(emptyToNull, z.string().nullable())
  .optional()

export const createCardSchema = z.object({
  name: cardNameSchema,
  phone: cardPhoneSchema,
  email: cardEmailSchema,
  company: cardCompanySchema,
  notes: cardNotesSchema,
  categoryId: cardCategoryIdSchema,
  imageUrl: cardImageUrlSchema,
  imagePublicId: cardImagePublicIdSchema,
})

export const updateCardSchema = z.object({
  id: z.string().uuid('Invalid card ID.'),
  name: cardNameSchema,
  phone: cardPhoneSchema,
  email: cardEmailSchema,
  company: cardCompanySchema,
  notes: cardNotesSchema,
  categoryId: cardCategoryIdSchema,
  imageUrl: cardImageUrlSchema,
  imagePublicId: cardImagePublicIdSchema,
})

export const deleteCardSchema = z.object({
  id: z.string().uuid('Invalid card ID.'),
})

export const listCardsSchema = z.object({
  search: z.string().optional(),
  categoryId: z.string().optional(),
  sort: z.enum(CARD_SORT_OPTIONS).optional(),
})

export type CreateCardInput = z.infer<typeof createCardSchema>
export type UpdateCardInput = z.infer<typeof updateCardSchema>
export type DeleteCardInput = z.infer<typeof deleteCardSchema>
export type ListCardsInput = z.infer<typeof listCardsSchema>
