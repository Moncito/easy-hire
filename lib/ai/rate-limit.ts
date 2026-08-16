import { isRedisConfigured, redisIncrWithTtl } from "@/lib/redis";

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
};

type Bucket = { count: number; resetAt: number };

/** In-memory fallback for local dev / environments without Upstash configured. */
const memoryBuckets = new Map<string, Bucket>();

function memoryRateLimit(key: string, limit: number, windowSeconds: number): RateLimitResult {
  const now = Date.now();
  const existing = memoryBuckets.get(key);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowSeconds * 1000;
    memoryBuckets.set(key, { count: 1, resetAt });
    return { allowed: true, limit, remaining: limit - 1, resetAt };
  }

  existing.count += 1;
  const allowed = existing.count <= limit;
  return { allowed, limit, remaining: Math.max(0, limit - existing.count), resetAt: existing.resetAt };
}

/**
 * Fixed-window rate limiter keyed by caller (usually `companyId:feature`).
 * Uses Upstash Redis when configured so limits are shared across serverless
 * instances; otherwise falls back to an in-process Map (best-effort only,
 * per-instance).
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  if (!isRedisConfigured) {
    return memoryRateLimit(key, limit, windowSeconds);
  }

  const redisKey = `ratelimit:${key}`;
  const count = await redisIncrWithTtl(redisKey, windowSeconds);

  if (count === null) {
    // Redis failed unexpectedly — degrade to the in-memory limiter rather than
    // blocking every request.
    return memoryRateLimit(key, limit, windowSeconds);
  }

  return {
    allowed: count <= limit,
    limit,
    remaining: Math.max(0, limit - count),
    resetAt: Date.now() + windowSeconds * 1000,
  };
}

/** Default Easy AI rate limit: N generations per company per feature per hour. */
export const AI_RATE_LIMIT_PER_HOUR = Number(process.env.EASY_AI_RATE_LIMIT_PER_HOUR ?? 30);

export async function checkAiRateLimit(companyId: string, feature: string): Promise<RateLimitResult> {
  return checkRateLimit(`ai:${companyId}:${feature}`, AI_RATE_LIMIT_PER_HOUR, 60 * 60);
}
