/**
 * Simple in-memory sliding window rate limiter.
 * Suitable for Vercel serverless (per-instance limiting).
 * For production-scale, consider Upstash Redis-based rate limiting.
 */

const windowMs = 60 * 1000; // 1 minute window
const maxRequestsPerWindow = 10;

const requestLog = new Map<string, number[]>();

// Cleanup stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamps] of requestLog.entries()) {
    const valid = timestamps.filter((t) => now - t < windowMs);
    if (valid.length === 0) {
      requestLog.delete(key);
    } else {
      requestLog.set(key, valid);
    }
  }
}, 5 * 60 * 1000);

export function checkRateLimit(identifier: string): {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
} {
  const now = Date.now();
  const timestamps = requestLog.get(identifier) ?? [];

  // Filter to only include timestamps within the current window
  const windowTimestamps = timestamps.filter((t) => now - t < windowMs);

  if (windowTimestamps.length >= maxRequestsPerWindow) {
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
    remaining: maxRequestsPerWindow - windowTimestamps.length,
    retryAfterMs: 0,
  };
}
