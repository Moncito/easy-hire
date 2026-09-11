/**
 * Single source of truth for the app's public base URL, used by everything
 * under lib/seo (JSON-LD builders, sitemap) that needs to emit an absolute
 * URL. `app/sitemap.ts` used to inline this expression directly — pulled out
 * here so both the sitemap and the structured-data builders stay in sync.
 */
/**
 * Re-exported from lib/shared/app-url.ts, which is now the single resolver
 * for this app's own base URL. It already strips trailing slashes and
 * guarantees a scheme, so `${BASE_URL}/path` stays safe.
 *
 * This used to fall back to a hardcoded `https://easyhire.ph` — a domain the
 * project did not own — which meant an unconfigured production deploy pointed
 * robots.txt, the sitemap and every JSON-LD block at someone else's address.
 */
export { APP_URL as BASE_URL } from "@/lib/shared/app-url";
import { APP_URL as BASE_URL } from "@/lib/shared/app-url";

/**
 * Resolves a possibly-relative value (a bare storage object path, a
 * site-relative path, or already-absolute URL) to an absolute URL anchored
 * at `BASE_URL`. Returns `null` for null/empty input rather than an empty
 * string, so callers can `?? undefined` it away from a JSON-LD payload.
 *
 * This does NOT know about Supabase bucket layout — it only guarantees the
 * result is absolute. Values that already come back from upload endpoints
 * (see `lib/shared/storage.ts`) are full `https://...` URLs for public
 * buckets, so the relative branch here is a defensive fallback for legacy or
 * hand-entered data, not the common case.
 */
export function toAbsoluteUrl(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  const path = trimmed.replace(/^\/+/, "");
  return `${BASE_URL}/${path}`;
}
