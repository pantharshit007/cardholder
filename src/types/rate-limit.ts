export type RateLimitEntry = { count: number; resetAt: number }
export type RateLimitResult = { allowed: boolean; retryAfter: number }
