// Edge-safe: imported by proxy.ts and client components, so no Prisma or
// Node-only imports may ever land here.

// Bump this whenever Terms or Privacy materially change; every non-admin user
// is then sent to /accept-terms once to re-accept.
export const CURRENT_TERMS_VERSION = "2026-10-01";

// Short-lived cookie the signup page sets before Google OAuth so the newly
// created account can be stamped with the consent given on the form.
export const TERMS_CONSENT_COOKIE = "eh_terms_consent";

export function hasAcceptedCurrentTerms(version: string | null | undefined): boolean {
  return version === CURRENT_TERMS_VERSION;
}

/**
 * Open-redirect guard for the `next` param: only same-origin relative paths
 * pass. "//host" and "/\host" are treated as protocol-relative by browsers, and
 * /accept-terms itself would loop.
 */
export function safeNextPath(raw: string | null | undefined, fallback = "/"): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) {
    return fallback;
  }
  const path = raw.split(/[?#]/)[0];
  if (path === "/accept-terms" || path.startsWith("/accept-terms/")) return fallback;
  return raw;
}
