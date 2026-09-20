import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import { requireUser } from '@/lib/require-user'
import {
  cardIdSchema,
  createCardSchema,
  deleteCardSchema,
  discardCardUploadSchema,
  listCardsSchema,
  updateCardSchema,
} from '@/lib/validators/card'
import { discardCardImageUploadForUser } from '@/services/card-upload.service'
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
  .validator((input?: unknown) => listCardsSchema.optional().parse(input))
  .handler(async ({ data }): Promise<CardListItem[]> => {
    const user = await requireUser()
    return listCardsForUser(user.id, data)
  })

export const getCard = createServerFn({ method: 'GET' })
  .validator((input) => z.object({ id: cardIdSchema }).parse(input))
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
        location: data.location ?? null,
        notes: data.notes ?? null,
        categoryId: data.categoryId ?? null,
        imageUploadId: data.imageUploadId ?? null,
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
        location: data.location ?? null,
        notes: data.notes ?? null,
        categoryId: data.categoryId ?? null,
        imageUploadId: data.imageUploadId ?? null,
        removeImage: data.removeImage ?? false,
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

export const discardCardUpload = createServerFn({ method: 'POST' })
  .validator((input) => discardCardUploadSchema.parse(input))
  .handler(
    async ({ data }): Promise<MutationResult<{ discarded: boolean }>> => {
      const user = await requireUser()

      try {
        const discarded = await discardCardImageUploadForUser({
          userId: user.id,
          id: data.id,
        })
        return mutationOk({ discarded })
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Could not discard the image upload.'
        return mutationFail(message, 'unknown')
      }
    },
  )
