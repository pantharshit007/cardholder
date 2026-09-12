import { createFileRoute, redirect } from '@tanstack/react-router'

import { CARDS_PATH } from '@/constants'

export const Route = createFileRoute('/_authenticated/cards/')({
  beforeLoad: () => {
    throw redirect({ to: CARDS_PATH })
  },
})
