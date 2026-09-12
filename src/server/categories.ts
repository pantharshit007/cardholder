import { createServerFn } from '@tanstack/react-start'

import { requireUser } from '@/lib/require-user'
import {
  createCategorySchema,
  deleteCategorySchema,
  updateCategorySchema,
} from '@/lib/validators/category'
import {
  DuplicateCategoryError,
  createCategoryForUser,
  deleteCategoryForUser,
  listCategoriesWithCounts,
  updateCategoryForUser,
} from '@/services/category.service'
import type { MutationResult } from '@/types/api'
import type { CategoryListItem, CategoryRecord } from '@/types/category'
import { mutationFail, mutationOk } from '@/utils/mutation-result'

function fromCategoryError(error: unknown): MutationResult<CategoryRecord> {
  if (error instanceof DuplicateCategoryError) {
    return mutationFail(error.message, 'duplicate')
  }

  throw error
}

export const listCategories = createServerFn({ method: 'GET' }).handler(
  async (): Promise<CategoryListItem[]> => {
    const user = await requireUser()
    return listCategoriesWithCounts(user.id)
  },
)

export const createCategory = createServerFn({ method: 'POST' })
  .validator((input) => createCategorySchema.parse(input))
  .handler(async ({ data }): Promise<MutationResult<CategoryRecord>> => {
    const user = await requireUser()

    try {
      const category = await createCategoryForUser({
        userId: user.id,
        name: data.name,
        color: data.color ?? null,
      })
      return mutationOk(category)
    } catch (error) {
      return fromCategoryError(error)
    }
  })

export const updateCategory = createServerFn({ method: 'POST' })
  .validator((input) => updateCategorySchema.parse(input))
  .handler(async ({ data }): Promise<MutationResult<CategoryRecord>> => {
    const user = await requireUser()

    try {
      const category = await updateCategoryForUser({
        userId: user.id,
        id: data.id,
        name: data.name,
        color: data.color ?? null,
      })

      if (!category) {
        return mutationFail('That drawer is not in this case.', 'not_found')
      }

      return mutationOk(category)
    } catch (error) {
      return fromCategoryError(error)
    }
  })

export const deleteCategory = createServerFn({ method: 'POST' })
  .validator((input) => deleteCategorySchema.parse(input))
  .handler(async ({ data }): Promise<MutationResult<CategoryRecord>> => {
    const user = await requireUser()
    const category = await deleteCategoryForUser({
      userId: user.id,
      id: data.id,
    })

    if (!category) {
      return mutationFail('That drawer is not in this case.', 'not_found')
    }

    return mutationOk(category)
  })
