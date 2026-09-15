/**
 * The single source of truth for this app's own public base URL.
 *
 * Before this existed the same fallback chain was copy-pasted into seven
 * modules with THREE different fallbacks — `http://localhost:3000` in
 * lib/shared/email.ts, lib/shared/email-layout.ts and lib/ai/digest.ts,
 * `https://easyhire.ph` in lib/seo/base-url.ts and app/robots.ts, and one
 * variant that didn't check `APP_URL` at all. The result: a production deploy
 * with no `NEXTAUTH_URL` sent password-reset and email-verification links
 * pointing at `http://localhost:3000` — i.e. at the recipient's own machine —
 * while simultaneously telling search engines the site lived at a domain the
 * project didn't own. Both failed silently for weeks.
 *
 * Everything that needs an absolute self-URL imports `APP_URL` from here.
 *
 * RESOLUTION ORDER
 *   1. `NEXTAUTH_URL`  — what this project already used; kept first so no
 *                        existing deployment changes behaviour.
 *   2. `APP_URL`       — the secondary override most of the old call sites
 *                        already honoured.
 *   3. `VERCEL_PROJECT_PRODUCTION_URL` — set automatically by Vercel on every
 *                        deployment, and it is the STABLE production host
 *                        (`my-app.vercel.app`), not the per-deployment
 *                        `VERCEL_URL` (`my-app-k3j9fx2-team.vercel.app`),
 *                        which changes on every push and must never be used
 *                        for links that outlive a deploy. This step is why a
 *                        Vercel project with no custom domain and no env vars
 *                        now works correctly instead of emitting localhost.
 *   4. `http://localhost:3000` — development only, and loudly complained
 *                        about if it is ever reached in production.
 */

const LOCAL_FALLBACK = "http://localhost:3000";

/**
 * Accepts `example.com`, `https://example.com` or `https://example.com/` and
 * always returns a scheme-qualified URL with no trailing slash.
 *
 * The bare-host case is not hypothetical politeness: a value like
 * `my-app.vercel.app` interpolated into `${APP_URL}/reset-password/abc`
 * produces a RELATIVE href, which an email client resolves against its own
 * domain (mail.google.com/reset-password/abc). That is worse than the
 * localhost bug, because the link looks plausible. `VERCEL_PROJECT_PRODUCTION_URL`
 * is itself scheme-less, so this normalisation is load-bearing, not defensive.
 */
function normalize(raw: string): string {
  const trimmed = raw.trim().replace(/\/+$/, "");
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  // Bare host. Localhost is http; anything else is https — a production host
  // reachable only over http is not a case worth defaulting to.
  const scheme = /^localhost(:\d+)?$/i.test(trimmed) ? "http" : "https";
  return `${scheme}://${trimmed}`;
}

function resolveAppUrl(): { url: string; isFallback: boolean } {
  const explicit = process.env.NEXTAUTH_URL?.trim() || process.env.APP_URL?.trim();
  if (explicit) return { url: normalize(explicit), isFallback: false };

  const vercelProductionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercelProductionHost) return { url: normalize(vercelProductionHost), isFallback: false };

  return { url: LOCAL_FALLBACK, isFallback: true };
}

const resolved = resolveAppUrl();

// Complain loudly rather than throwing. Throwing at module scope would abort
// `next build`, which legitimately runs with NODE_ENV=production on a machine
// that has none of these variables set — so a hard failure here would break
// local builds while fixing nothing. This at least puts a named error in the
// production logs instead of silently shipping localhost links.
//
// Skipped during `next build` itself (NEXT_PHASE), because a local production
// build has no reason to have these set and a warning that cries wolf on every
// build is a warning nobody reads when it finally matters.
if (
  resolved.isFallback &&
  process.env.NODE_ENV === "production" &&
  process.env.NEXT_PHASE !== "phase-production-build"
) {
  console.error(
    "[app-url] No NEXTAUTH_URL, APP_URL or VERCEL_PROJECT_PRODUCTION_URL is set in production. " +
      `Falling back to ${LOCAL_FALLBACK}, which means every emailed link (password reset, email ` +
      "verification, invitations) points at the recipient's own machine and is unusable. Set NEXTAUTH_URL."
  );
}

/** Absolute, scheme-qualified, no trailing slash — safe for `${APP_URL}/path`. */
export const APP_URL = resolved.url;

/** True when nothing was configured and `APP_URL` is the localhost fallback. Exported so a health/system screen can surface it (docs/ADMIN-CONSOLE-PLAN.md §4.10). */
export const IS_FALLBACK_APP_URL = resolved.isFallback;
