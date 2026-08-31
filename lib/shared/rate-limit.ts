import { isRedisConfigured, redisIncrWithTtl } from "@/lib/redis";
import { ApiError } from "@/lib/shared/api-error";

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
};

type Bucket = { count: number; resetAt: number };

/**
 * In-memory fallback used when Upstash is unconfigured, or degrades to when
 * Upstash errors at request time. Best-effort only: each serverless instance
 * gets its own Map, so this provides no real protection across a fleet of
 * lambdas — see the UPSTASH_REDIS_REST_URL comment in .env.example.
 */
const memoryBuckets = new Map<string, Bucket>();

export function memoryRateLimit(key: string, limit: number, windowSeconds: number): RateLimitResult {
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

export type CheckRateLimitInput = {
  /** Fully-namespaced identifier for the bucket being limited, e.g. "register:ip:1.2.3.4". */
  key: string;
  limit: number;
  windowSeconds: number;
};

/**
 * Fixed-window rate limiter keyed by caller. Uses Upstash Redis when
 * configured so limits are shared across serverless instances; otherwise —
 * or if Redis errors at request time — falls back to an in-process Map.
 *
 * Always fails OPEN: a Redis outage degrades protection, it never blocks
 * legitimate traffic app-wide.
 */
export async function checkRateLimit(input: CheckRateLimitInput): Promise<RateLimitResult> {
  const { key, limit, windowSeconds } = input;

  if (!isRedisConfigured) {
    return memoryRateLimit(key, limit, windowSeconds);
  }

  try {
    const redisKey = `ratelimit:${key}`;
    const count = await redisIncrWithTtl(redisKey, windowSeconds);

    if (count === null) {
      // lib/redis.ts already logged the underlying error — degrade to the
      // in-memory limiter rather than blocking every request.
      console.warn(`[rate-limit] Upstash unavailable for key "${key}" — degrading to in-memory limiter`);
      return memoryRateLimit(key, limit, windowSeconds);
    }

    return {
      allowed: count <= limit,
      limit,
      remaining: Math.max(0, limit - count),
      resetAt: Date.now() + windowSeconds * 1000,
    };
  } catch (error) {
    // Belt-and-braces: redisIncrWithTtl already catches internally, but never
    // let an unexpected throw here take down the request it's guarding.
    console.warn(`[rate-limit] unexpected error checking limit for key "${key}" — failing open:`, error);
    return memoryRateLimit(key, limit, windowSeconds);
  }
}

/**
 * Same as `checkRateLimit`, but throws `ApiError("Too many requests", 429)`
 * when the bucket is exhausted — for the common case of "check and bail" at
 * the top of a route handler or /lib helper.
 */
export async function enforceRateLimit(input: CheckRateLimitInput): Promise<RateLimitResult> {
  const result = await checkRateLimit(input);
  if (!result.allowed) {
    const retryAfterSeconds = Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000));
    throw new ApiError("Too many requests", 429, retryAfterSeconds);
  }
  return result;
}

/**
 * Builds a namespaced rate-limit key for a request: prefers the
 * authenticated `userId` when available, otherwise derives the client IP
 * from `x-forwarded-for` (first hop, trimmed) falling back to `x-real-ip`.
 * Always namespaced by `scope` so different endpoints never share a bucket.
 */
export function clientKeyFromRequest(req: Request, scope: string, userId?: string): string {
  if (userId) {
    return `${scope}:user:${userId}`;
  }

  const forwardedFor = req.headers.get("x-forwarded-for");
  const firstHop = forwardedFor?.split(",")[0]?.trim();
  const ip = firstHop || req.headers.get("x-real-ip")?.trim() || "unknown";

  return `${scope}:ip:${ip}`;
}
