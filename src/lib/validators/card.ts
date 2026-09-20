import { z } from 'zod'

import {
  CARD_CONFIG,
  CARD_NAME_MIN_LENGTH,
  CARD_SORT_OPTIONS,
  FIELD_LIMITS,
} from '@/constants'

function emptyToNull(value: unknown): unknown {
  if (typeof value !== 'string') return value
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export const cardNameSchema = z
  .string()
  .trim()
  .min(CARD_NAME_MIN_LENGTH, 'Enter a name.')
  .max(FIELD_LIMITS.name, `Keep it under ${FIELD_LIMITS.name} characters.`)

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

export const cardLocationSchema = z
  .preprocess(
    emptyToNull,
    z
      .string()
      .max(
        FIELD_LIMITS.location,
        `Keep it under ${FIELD_LIMITS.location} characters.`,
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
  .preprocess((value) => {
    if (!value || value === 'none' || value === 'null') return null
    return emptyToNull(value)
  }, z.string().uuid('Invalid category ID.').nullable())
  .optional()

export const cardIdSchema = z.string().uuid('Invalid card ID.')

export const cardImageUploadIdSchema = z
  .preprocess(
    emptyToNull,
    z.string().uuid('Invalid image upload ID.').nullable(),
  )
  .optional()

export const createCardSchema = z.object({
  name: cardNameSchema,
  phone: cardPhoneSchema,
  email: cardEmailSchema,
  company: cardCompanySchema,
  location: cardLocationSchema,
  notes: cardNotesSchema,
  categoryId: cardCategoryIdSchema,
  imageUploadId: cardImageUploadIdSchema,
})

export const updateCardSchema = z
  .object({
    id: cardIdSchema,
    name: cardNameSchema,
    phone: cardPhoneSchema,
    email: cardEmailSchema,
    company: cardCompanySchema,
    location: cardLocationSchema,
    notes: cardNotesSchema,
    categoryId: cardCategoryIdSchema,
    imageUploadId: cardImageUploadIdSchema,
    removeImage: z.boolean().optional(),
  })
  .refine((input) => !(input.imageUploadId && input.removeImage), {
    message: 'Cannot upload and remove an image in the same request.',
  })

export const deleteCardSchema = z.object({
  id: cardIdSchema,
})

export const discardCardUploadSchema = z.object({
  id: z.string().uuid('Invalid image upload ID.'),
})

export const listCardsSchema = z.object({
  search: z.string().trim().max(CARD_CONFIG.searchMaxLength).optional(),
  categoryId: z
    .union([z.string().uuid(), z.literal('all'), z.literal('uncategorized')])
    .optional(),
  sort: z.enum(CARD_SORT_OPTIONS).optional(),
  limit: z.number().int().positive().max(CARD_CONFIG.maxPageSize).optional(),
  offset: z.number().int().nonnegative().optional(),
})

export type CreateCardInput = z.infer<typeof createCardSchema>
export type UpdateCardInput = z.infer<typeof updateCardSchema>
export type DeleteCardInput = z.infer<typeof deleteCardSchema>
export type ListCardsInput = z.infer<typeof listCardsSchema>

// Invalid bookmarks fall back per field; RPC validation remains strict.
export const cardListSearchSchema = z.object({
  search: listCardsSchema.shape.search.catch(undefined),
  categoryId: listCardsSchema.shape.categoryId.catch(undefined),
  sort: listCardsSchema.shape.sort.catch(undefined),
})
