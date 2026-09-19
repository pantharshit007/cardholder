import { createFileRoute } from '@tanstack/react-router'
import { handleCardAutofill } from '@/server/ocr'

export const Route = createFileRoute('/api/ocr')({
  server: { handlers: { POST: ({ request }) => handleCardAutofill(request) } },
})
