/**
 * Single source of truth for the app's public base URL, used by everything
 * under lib/seo (JSON-LD builders, sitemap) that needs to emit an absolute
 * URL. `app/sitemap.ts` used to inline this expression directly — pulled out
 * here so both the sitemap and the structured-data builders stay in sync.
 */
const RAW_BASE = process.env.NEXTAUTH_URL ?? process.env.APP_URL ?? "https://easyhire.ph";

/** Strip a trailing slash so callers can safely do `${BASE_URL}/path` without producing `//path`. */
export const BASE_URL = RAW_BASE.replace(/\/+$/, "");

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
