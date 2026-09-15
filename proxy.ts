import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "./auth.config";
import { IMPERSONATION_COOKIE_NAME, verifyImpersonationToken } from "@/lib/admin/impersonation-token";

// Uses the edge-safe config only — does NOT import from ./auth.ts,
// so Prisma/bcrypt never get bundled into the Edge Runtime.
// lib/admin/impersonation-token.ts is likewise Edge-safe (Web Crypto only,
// no Prisma) — see that module's own doc comment.
const { auth } = NextAuth(authConfig);

export default auth(async (req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const role = req.auth?.user?.role;

  const isSeekerRoute = nextUrl.pathname.startsWith("/seeker");
  const isEmployerRoute = nextUrl.pathname.startsWith("/employer");
  const isAdminRoute = nextUrl.pathname.startsWith("/admin");

  const isProtectedRoute = isSeekerRoute || isEmployerRoute || isAdminRoute;

  if (isProtectedRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  // Impersonation "view as" overlay (docs/ADMIN-CONSOLE-PLAN.md §8.2). An
  // ADMIN carrying a signature-valid, unexpired impersonation cookie is let
  // through to /seeker or /employer instead of being bounced by the plain
  // role check below. This is OPTIMISTIC ONLY — verifyImpersonationToken
  // proves the cookie is ours and not yet expired, nothing more (see its own
  // doc comment). The AUTHORITATIVE check is resolveActiveImpersonation()
  // in lib/admin/impersonation.ts, which additionally loads the DB row
  // (endedAt/expiresAt) and re-checks the admin's live `impersonate`
  // permission — that is what actually decides whether the seeker/employer
  // layout renders anything. A false positive here only ever reaches a page
  // that itself resolves to `null`/redirect once the real gate runs.
  const isSeekerOrEmployerRoute = isSeekerRoute || isEmployerRoute;
  let hasOptimisticImpersonationCookie = false;
  if (isSeekerOrEmployerRoute && role === "ADMIN") {
    const rawCookie = req.cookies.get(IMPERSONATION_COOKIE_NAME)?.value;
    const payload = await verifyImpersonationToken(rawCookie);
    hasOptimisticImpersonationCookie = payload !== null;
  }

  // Cheap early read-only fast-fail: while an (optimistically valid)
  // impersonation cookie is present, refuse any non-GET/HEAD request to
  // /seeker or /employer here, before it ever reaches a route handler or
  // Server Action. Belt-and-braces alongside the real read-only enforcement,
  // which is that the admin's real session is still `role: ADMIN` and every
  // seeker/employer API route already rejects that role on its own.
  if (isSeekerOrEmployerRoute && hasOptimisticImpersonationCookie) {
    const method = req.method.toUpperCase();
    if (method !== "GET" && method !== "HEAD") {
      return NextResponse.json({ error: "Read-only while impersonating." }, { status: 403 });
    }
  }

  if (isSeekerRoute && role !== "SEEKER" && !hasOptimisticImpersonationCookie) {
    return NextResponse.redirect(new URL("/", nextUrl));
  }

  if (isEmployerRoute && role !== "EMPLOYER" && !hasOptimisticImpersonationCookie) {
    return NextResponse.redirect(new URL("/", nextUrl));
  }

  if (isAdminRoute && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", nextUrl));
  }

  return NextResponse.next();
});

// Deliberately NOT `/api/:path*`. This proxy wraps everything in NextAuth's
// `auth()`, which resolves a session on every matched request. Extending the
// matcher to /api would run that resolution on bearer-authenticated cron
// routes and public endpoints too, and could redirect requests that were
// never meant to go through a browser session at all. The overlay design
// does not need it: the admin's real NextAuth session stays `role: ADMIN`
// for the whole impersonation, so every seeker/employer API route already
// rejects it via that route's own role guard — see
// lib/admin/impersonation.ts's module doc comment. Do not "fix" this later.
export const config = {
  matcher: ["/seeker/:path*", "/employer/:path*", "/admin/:path*"],
};