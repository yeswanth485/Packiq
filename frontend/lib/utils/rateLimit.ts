// 🔴 BUG #7 FIX: Rate limiting utility for API endpoints
// In-memory rate limiter (for single-instance deployments)
// For distributed deployments, consider Redis-based solution

interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

/**
 * Check if request exceeds rate limit
 * @param key - Unique identifier (e.g., userId + endpoint)
 * @param limit - Maximum requests allowed
 * @param windowMs - Time window in milliseconds
 * @returns true if request is allowed, false if rate limited
 */
export function checkRateLimit(
  key: string,
  limit: number = 10,
  windowMs: number = 60000 // 1 minute default
): boolean {
  const now = Date.now()
  const entry = rateLimitStore.get(key)

  // New entry or window expired
  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs
    })
    return true // Allow request
  }

  // Increment counter
  entry.count++

  if (entry.count > limit) {
    return false // Reject request
  }

  return true // Allow request
}

/**
 * Get current rate limit status
 */
export function getRateLimitStatus(
  key: string,
  limit: number = 10,
  windowMs: number = 60000
): { allowed: boolean; current: number; limit: number; resetIn: number } {
  const now = Date.now()
  const entry = rateLimitStore.get(key)

  if (!entry || now > entry.resetTime) {
    return {
      allowed: true,
      current: 0,
      limit,
      resetIn: windowMs
    }
  }

  const resetIn = Math.max(0, entry.resetTime - now)

  return {
    allowed: entry.count <= limit,
    current: entry.count,
    limit,
    resetIn
  }
}

/**
 * Reset rate limit for a key
 */
export function resetRateLimit(key: string): void {
  rateLimitStore.delete(key)
}

/**
 * Clean up expired entries (run periodically)
 */
export function cleanupRateLimitStore(): void {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}

// Clean up every 5 minutes
setInterval(cleanupRateLimitStore, 5 * 60 * 1000)
