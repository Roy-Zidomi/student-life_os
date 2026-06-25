/**
 * Simple in-memory sliding window rate limiter.
 * Suitable for Vercel serverless (per-instance limiting).
 *
 * NOTE: In serverless environments each cold start resets the Map.
 * For production-scale rate limiting, consider Upstash Redis.
 * This still provides meaningful protection against burst abuse
 * within a single instance's lifetime.
 */

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute window
  maxRequests: 10,
};

/** Rate limit config for server action write operations */
export const ACTION_WRITE_LIMIT: RateLimitConfig = {
  windowMs: 60 * 1000,
  maxRequests: 30,
};

/** Rate limit config for AI chat */
export const CHAT_LIMIT: RateLimitConfig = {
  windowMs: 60 * 1000,
  maxRequests: 10,
};

const requestLog = new Map<string, number[]>();

/**
 * Lazily cleans stale entries to prevent memory leaks.
 * Called on every check instead of using setInterval
 * (which is inappropriate in serverless environments).
 */
let lastCleanupTime = 0;

function lazyCleanup(windowMs: number): void {
  const now = Date.now();
  // Only clean up every 60 seconds to avoid overhead
  if (now - lastCleanupTime < 60_000) return;
  lastCleanupTime = now;

  for (const [key, timestamps] of requestLog.entries()) {
    const valid = timestamps.filter((t) => now - t < windowMs);
    if (valid.length === 0) {
      requestLog.delete(key);
    } else {
      requestLog.set(key, valid);
    }
  }
}

export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = DEFAULT_CONFIG
): {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
} {
  const now = Date.now();
  const { windowMs, maxRequests } = config;

  // Lazy cleanup instead of setInterval
  lazyCleanup(windowMs);

  const timestamps = requestLog.get(identifier) ?? [];

  // Filter to only include timestamps within the current window
  const windowTimestamps = timestamps.filter((t) => now - t < windowMs);

  if (windowTimestamps.length >= maxRequests) {
    const oldestInWindow = windowTimestamps[0];
    const retryAfterMs = windowMs - (now - oldestInWindow);
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs,
    };
  }

  windowTimestamps.push(now);
  requestLog.set(identifier, windowTimestamps);

  return {
    allowed: true,
    remaining: maxRequests - windowTimestamps.length,
    retryAfterMs: 0,
  };
}
