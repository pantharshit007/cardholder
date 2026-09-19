import { OCR_CONFIG } from '@/constants'
import type { RateLimitEntry, RateLimitResult } from '@/types/rate-limit'

/** Process-local fixed windows; expired entries are pruned on each request. */
export function createOcrRateLimiter() {
  const entries = new Map<string, RateLimitEntry>()
  return (userId: string, now = Date.now()): RateLimitResult => {
    for (const [key, entry] of entries) {
      if (entry.resetAt <= now) entries.delete(key)
    }
    const entry = entries.get(userId) ?? {
      count: 0,
      resetAt: now + OCR_CONFIG.rateLimit.windowMs,
    }
    entries.set(userId, entry)
    const retryAfter = Math.ceil(
      (entry.resetAt - now) / OCR_CONFIG.rateLimit.millisecondsPerSecond,
    )
    if (entry.count >= OCR_CONFIG.rateLimit.requests)
      return { allowed: false, retryAfter }
    entry.count++
    return { allowed: true, retryAfter: 0 }
  }
}

export const consumeOcrQuota = createOcrRateLimiter()
