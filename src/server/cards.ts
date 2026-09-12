import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import { requireUser } from '@/lib/require-user'
import {
  createCardSchema,
  deleteCardSchema,
  listCardsSchema,
  updateCardSchema,
} from '@/lib/validators/card'
import {
  createCardForUser,
  deleteCardForUser,
  getCardForUser,
  listCardsForUser,
  updateCardForUser,
} from '@/services/card.service'
import type { MutationResult } from '@/types/api'
import type { CardListItem, CardRecord } from '@/types/card'
import { mutationFail, mutationOk } from '@/utils/mutation-result'

export const listCards = createServerFn({ method: 'GET' })
  .validator((input) => listCardsSchema.optional().parse(input))
  .handler(async ({ data }): Promise<CardListItem[]> => {
    const user = await requireUser()
    return listCardsForUser(user.id, data)
  })

export const getCard = createServerFn({ method: 'GET' })
  .validator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }): Promise<CardRecord | null> => {
    const user = await requireUser()
    return getCardForUser(user.id, data.id)
  })

export const createCard = createServerFn({ method: 'POST' })
  .validator((input) => createCardSchema.parse(input))
  .handler(async ({ data }): Promise<MutationResult<CardRecord>> => {
    const user = await requireUser()

    try {
      const card = await createCardForUser({
        userId: user.id,
        name: data.name,
        phone: data.phone ?? null,
        email: data.email ?? null,
        company: data.company ?? null,
        notes: data.notes ?? null,
        categoryId: data.categoryId ?? null,
        imageUrl: data.imageUrl ?? null,
        imagePublicId: data.imagePublicId ?? null,
      })
      return mutationOk(card)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Could not create the card.'
      return mutationFail(message, 'unknown')
    }
  })

export const updateCard = createServerFn({ method: 'POST' })
  .validator((input) => updateCardSchema.parse(input))
  .handler(async ({ data }): Promise<MutationResult<CardRecord>> => {
    const user = await requireUser()

    try {
      const card = await updateCardForUser({
        userId: user.id,
        id: data.id,
        name: data.name,
        phone: data.phone ?? null,
        email: data.email ?? null,
        company: data.company ?? null,
        notes: data.notes ?? null,
        categoryId: data.categoryId ?? null,
        imageUrl: data.imageUrl ?? null,
        imagePublicId: data.imagePublicId ?? null,
      })

      if (!card) {
        return mutationFail('That card could not be found.', 'not_found')
      }

      return mutationOk(card)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Could not update the card.'
      return mutationFail(message, 'unknown')
    }
  })

export const deleteCard = createServerFn({ method: 'POST' })
  .validator((input) => deleteCardSchema.parse(input))
  .handler(async ({ data }): Promise<MutationResult<CardRecord>> => {
    const user = await requireUser()

    try {
      const card = await deleteCardForUser({
        userId: user.id,
        id: data.id,
      })

      if (!card) {
        return mutationFail('That card could not be found.', 'not_found')
      }

      return mutationOk(card)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Could not delete the card.'
      return mutationFail(message, 'unknown')
    }
  })
