import { Redis } from "@upstash/redis";

/**
 * Thin Upstash Redis wrapper used for L3 caching: AI rate limits, analytics
 * rollup caching, and featured-job/badge lookups. Falls back to a no-op
 * client when Upstash env vars are missing so local dev / free-tier deploys
 * never crash — callers should treat every miss as "not cached" and fall
 * through to the source of truth (Postgres or in-memory fallback).
 */

const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

export const isRedisConfigured = !!(UPSTASH_REDIS_REST_URL && UPSTASH_REDIS_REST_TOKEN);

const client: Redis | null = isRedisConfigured
  ? new Redis({ url: UPSTASH_REDIS_REST_URL!, token: UPSTASH_REDIS_REST_TOKEN! })
  : null;

if (!isRedisConfigured && process.env.NODE_ENV !== "production") {
  console.warn(
    "[redis] UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN not set — using no-op cache (AI rate limits fall back to in-memory, rollups skip cache)."
  );
}

export async function redisGet<T>(key: string): Promise<T | null> {
  if (!client) return null;
  try {
    return await client.get<T>(key);
  } catch (error) {
    console.error("[redis] get failed:", error);
    return null;
  }
}

export async function redisSet(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
  if (!client) return;
  try {
    if (ttlSeconds && ttlSeconds > 0) {
      await client.set(key, value, { ex: ttlSeconds });
    } else {
      await client.set(key, value);
    }
  } catch (error) {
    console.error("[redis] set failed:", error);
  }
}

export async function redisDel(key: string): Promise<void> {
  if (!client) return;
  try {
    await client.del(key);
  } catch (error) {
    console.error("[redis] del failed:", error);
  }
}

/** Atomic increment with optional TTL applied on first write — used for rate limiting. */
export async function redisIncrWithTtl(key: string, ttlSeconds: number): Promise<number | null> {
  if (!client) return null;
  try {
    const count = await client.incr(key);
    if (count === 1) {
      await client.expire(key, ttlSeconds);
    }
    return count;
  } catch (error) {
    console.error("[redis] incr failed:", error);
    return null;
  }
}

export function getRedisClient(): Redis | null {
  return client;
}
