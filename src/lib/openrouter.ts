import { OpenRouter } from '@openrouter/sdk'
import { env } from '@/env'

/** Construct the server-side SDK client from validated private configuration. */
export function getOpenRouterClient() {
  if (!env.OPENROUTER_API_KEY) throw new Error('Autofill is not configured.')
  return new OpenRouter({ apiKey: env.OPENROUTER_API_KEY })
}
