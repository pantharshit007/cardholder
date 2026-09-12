import { z } from 'zod'

import {
  CATEGORY_COLOR_HEXES,
  CATEGORY_NAME_MIN_LENGTH,
  FIELD_LIMITS,
} from '@/constants'

export const categoryNameSchema = z
  .string()
  .trim()
  .min(CATEGORY_NAME_MIN_LENGTH, 'Enter a name.')
  .max(
    FIELD_LIMITS.categoryName,
    `Keep it under ${FIELD_LIMITS.categoryName} characters.`,
  )

export const categoryColorSchema = z
  .enum(CATEGORY_COLOR_HEXES)
  .nullable()
  .optional()

export const createCategorySchema = z.object({
  name: categoryNameSchema,
  color: categoryColorSchema,
})

export const updateCategorySchema = z.object({
  id: z.uuid(),
  name: categoryNameSchema,
  color: categoryColorSchema,
})

export const deleteCategorySchema = z.object({
  id: z.uuid(),
})

export type CreateCategoryInput = z.infer<typeof createCategorySchema>
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>
export type DeleteCategoryInput = z.infer<typeof deleteCategorySchema>
