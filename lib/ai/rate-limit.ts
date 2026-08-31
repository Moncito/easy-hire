import { checkRateLimit as checkSharedRateLimit, type RateLimitResult } from "@/lib/shared/rate-limit";

export type { RateLimitResult };

/**
 * Fixed-window rate limiter keyed by caller (usually `companyId:feature`).
 * Delegates to the shared limiter in lib/shared/rate-limit.ts — kept here as
 * a thin wrapper so existing imports (lib/ai/run.ts) don't need to change.
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  return checkSharedRateLimit({ key, limit, windowSeconds });
}

/** Default Easy AI rate limit: N generations per company per feature per hour. */
export const AI_RATE_LIMIT_PER_HOUR = Number(process.env.EASY_AI_RATE_LIMIT_PER_HOUR ?? 30);

export async function checkAiRateLimit(companyId: string, feature: string): Promise<RateLimitResult> {
  return checkRateLimit(`ai:${companyId}:${feature}`, AI_RATE_LIMIT_PER_HOUR, 60 * 60);
}
