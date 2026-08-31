import { timingSafeEqual } from "crypto";
import { ApiError } from "@/lib/shared/api-error";

/**
 * Guards cron routes. Fails CLOSED: if CRON_SECRET isn't configured, every
 * request is rejected with 503 rather than silently allowing access.
 */
export function requireCronAuth(req: Request): void {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    throw new ApiError("Cron is not configured", 503);
  }

  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    throw new ApiError("Unauthorized", 401);
  }

  const expected = Buffer.from(`Bearer ${cronSecret}`);
  const actual = Buffer.from(authHeader);

  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    throw new ApiError("Unauthorized", 401);
  }
}
