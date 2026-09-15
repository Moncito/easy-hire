import { cache } from "react";
import { cookies } from "next/headers";
import type { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";
import { hasPermission, loadResolvedAdminAccess, requireAdminPermission } from "@/lib/admin/permissions";
import { buildAdminActionOperation } from "@/lib/admin/audit";
import { impersonationEndSchema, impersonationStartSchema } from "@/lib/validations/admin";
import { IMPERSONATION_COOKIE_NAME, verifyImpersonationToken } from "@/lib/admin/impersonation-token";

/**
 * The authoritative "view-as overlay" layer — docs/ADMIN-CONSOLE-PLAN.md
 * §8.2. Everything in this file runs Node-only (Prisma) and is the real
 * gate; `lib/admin/impersonation-token.ts` (Edge-safe) is only the
 * optimistic signature/expiry check `proxy.ts` is allowed to make.
 *
 * DESIGN — "view-as overlay", not a session swap. The admin's real NextAuth
 * session stays `role: ADMIN` for the whole duration. Impersonation only
 * changes what `requireSeekerLayoutContext`/`requireEmployerLayoutContext`
 * (lib/auth/seeker-session.ts, lib/auth/employer-session.ts) render for
 * READS. Because the real session is still ADMIN, any write to a
 * seeker/employer API route is already rejected by that route's own role
 * guard — a missed overlay call site fails closed (falls back to "not
 * signed in as a seeker/employer"), never open.
 *
 * WRITE MODE IS NOT REPRESENTABLE. `ImpersonationSession.scope` is written
 * as the literal `"READ_ONLY"` in exactly one place (startImpersonation
 * below) and nowhere else in this module accepts or branches on `scope` —
 * there is no flag, parameter, or code path that could produce anything
 * else. §8.2 defers write mode indefinitely; this is not a placeholder for
 * it, it is the absence of it.
 */

/** Exactly 1 hour, per §8.2 ("Impersonation token TTL of 1 hour, separate from the normal session token"). Named so every reference (session creation, cookie maxAge, tests) reads from one place. */
export const IMPERSONATION_TTL_MS = 60 * 60 * 1000;

export type ImpersonationSessionRow = {
  id: string;
  adminUserId: string;
  targetUserId: string;
  ticketReference: string;
  scope: "READ_ONLY";
  reason: string;
  startedAt: Date;
  expiresAt: Date;
  endedAt: Date | null;
  endedReason: string | null;
  ipHash: string | null;
};

// ============================================================================
// Pure decision helpers — DB-free, unit-tested directly (same discipline as
// lib/admin/permissions.ts's assertSelfTeamActionAllowed/
// assertLastSuperAdminSafe: the rule is a pure function, the DB-facing
// caller only supplies the inputs it already had to fetch anyway).
// ============================================================================

/** §8.2 doesn't name this explicitly, but "who/whom" implies it: an admin viewing their own account as a "target" is meaningless — refuse it outright rather than silently permitting a no-op overlay. */
export function assertNotSelfImpersonation(adminUserId: string, targetUserId: string): void {
  if (adminUserId === targetUserId) {
    throw new ApiError("You cannot impersonate yourself.", 400);
  }
}

/**
 * §8.2: "Role-gated. SUPER_ADMIN only, and never against another
 * SUPER_ADMIN." Refusing every `Role.ADMIN` target — not just ones who
 * happen to hold the SUPER_ADMIN `AdminLevel` — is strictly STRONGER than
 * that requirement and satisfies it a fortiori: any admin target would
 * necessarily include every SUPER_ADMIN target, so the letter of the rule
 * is covered, and the spirit is too, since a `Role.ADMIN` user has no
 * seeker/employer surface for the overlay to legitimately show in the first
 * place (the overlay only ever renders `/seeker` or `/employer` reads).
 * Blanket-refusing by `Role` also means this check never has to reach into
 * `AdminLevel`/`AdminProfile` at all, which keeps this module's only
 * dependency on lib/admin/permissions.ts the `impersonate` permission gate
 * itself.
 */
export function assertTargetNotAdmin(targetRole: Role): void {
  if (targetRole === "ADMIN") {
    throw new ApiError("Cannot impersonate another admin account.", 403);
  }
}

/** §8.2: "one at a time, so the audit trail is unambiguous" (task spec). Pure predicate over whether the admin already has a live session — the DB-facing caller decides how "already has one" was determined. */
export function assertNoActiveSession(adminHasActiveSession: boolean): void {
  if (adminHasActiveSession) {
    throw new ApiError("You already have an active impersonation session. End it before starting another.", 409);
  }
}

/**
 * The single authoritative "is this session row currently usable" rule,
 * shared by `resolveActiveImpersonation` below and directly unit-tested
 * DB-free. Active iff NOT explicitly ended AND the TTL has not elapsed.
 * `expiresAt > now` is a strict inequality — the exact expiry instant is
 * already expired (fail closed at the boundary).
 */
export function isSessionActive(session: { endedAt: Date | null; expiresAt: Date }, now: Date): boolean {
  if (session.endedAt !== null) return false;
  return session.expiresAt.getTime() > now.getTime();
}

/**
 * Pure — whether an end-session request should actually mutate anything.
 * `false` for: no such session, a session belonging to a different admin
 * (ending is self-service only — see `EndImpersonationInput.adminUserId`'s
 * doc comment), or a session that has already ended. All three make
 * `endImpersonation` below a silent no-op rather than a throw or a second
 * audit row — the idempotency the task spec requires.
 */
export function canEndImpersonation(
  existing: { adminUserId: string; endedAt: Date | null } | null,
  requestingAdminUserId: string
): boolean {
  if (!existing) return false;
  if (existing.adminUserId !== requestingAdminUserId) return false;
  if (existing.endedAt !== null) return false;
  return true;
}

// ============================================================================
// Start
// ============================================================================

export type StartImpersonationInput = {
  adminUserId: string;
  targetUserId: string;
  ticketReference: string;
  reason: string;
  ipHash?: string;
};

/**
 * Starts a READ_ONLY impersonation session. Order of checks matters: RBAC
 * first (so a non-SUPER_ADMIN never learns anything about the target from
 * later error messages), then the input shape, then the target-specific
 * refusals, then the one-active-session floor, then the write.
 */
export async function startImpersonation(input: StartImpersonationInput): Promise<ImpersonationSessionRow> {
  const { adminUserId, ipHash } = input;

  // Real gate — §8.1 "permission checks at the /lib layer too, not only at
  // the route." The route also calls requireAdminWithPermission before this
  // (defence in depth); this call is the one that actually matters.
  await requireAdminPermission(adminUserId, "impersonate");

  // Re-validated here (not just trusted from the route) for the same
  // defence-in-depth reason — a route that forgot to call
  // impersonationStartSchema.parse() must not be the only thing standing
  // between a missing ticket reference and a live session.
  const { targetUserId, ticketReference, reason } = impersonationStartSchema.parse({
    targetUserId: input.targetUserId,
    ticketReference: input.ticketReference,
    reason: input.reason,
  });

  assertNotSelfImpersonation(adminUserId, targetUserId);

  const target = await prisma.user.findUnique({ where: { id: targetUserId }, select: { id: true, role: true } });
  if (!target) {
    throw new ApiError("Target user not found.", 404);
  }
  assertTargetNotAdmin(target.role);

  const now = new Date();
  const existingActive = await prisma.impersonationSession.findFirst({
    where: { adminUserId, endedAt: null, expiresAt: { gt: now } },
    select: { id: true },
  });
  assertNoActiveSession(existingActive !== null);

  const expiresAt = new Date(now.getTime() + IMPERSONATION_TTL_MS);

  // Interactive transaction (not the array form) because the audit row must
  // reference the newly created session's own id, which only exists once
  // the create has run — same "either both land or neither does" discipline
  // as buildAdminActionOperation's other callers, just via the callback form
  // since this one has an inter-statement data dependency the array form
  // can't express.
  const created = await prisma.$transaction(async (tx) => {
    const session = await tx.impersonationSession.create({
      data: {
        adminUserId,
        targetUserId,
        ticketReference,
        reason,
        scope: "READ_ONLY",
        expiresAt,
        ipHash: ipHash ?? null,
      },
    });

    await buildAdminActionOperation(
      {
        adminUserId,
        action: "IMPERSONATE_START",
        targetType: "USER",
        targetId: targetUserId,
        impersonationSessionId: session.id,
        ipHash,
        after: { ticketReference, scope: "READ_ONLY", expiresAt: session.expiresAt.toISOString() },
      },
      tx
    );

    return session;
  });

  return created as ImpersonationSessionRow;
}

// ============================================================================
// End
// ============================================================================

export type EndImpersonationInput = {
  sessionId: string;
  /** The session must belong to this admin — ending is self-service only; a session that has already auto-died (e.g. via the live permission re-check in resolveActiveImpersonation) doesn't need an explicit end call. */
  adminUserId: string;
  reason?: string;
};

/**
 * Idempotent by design: ending a session that doesn't exist, doesn't belong
 * to this admin, or is already ended is a silent no-op — never a throw,
 * never a second audit row. This matters because the DELETE route (and a
 * client retry, or a double-click) must be safe to call more than once.
 */
export async function endImpersonation(input: EndImpersonationInput): Promise<void> {
  const { sessionId, adminUserId } = input;
  const { reason } = impersonationEndSchema.parse({ reason: input.reason });

  const now = new Date();

  await prisma.$transaction(async (tx) => {
    const existing = await tx.impersonationSession.findUnique({ where: { id: sessionId } });

    // The `!existing` arm is redundant with canEndImpersonation's own null
    // check by rule, but is spelled out here too so TypeScript can narrow
    // `existing` to non-null for the audit-row fields referenced below —
    // canEndImpersonation returning `boolean` isn't a type guard on its
    // `existing` parameter from this call site's point of view.
    if (!existing || !canEndImpersonation(existing, adminUserId)) {
      return; // idempotent no-op — see canEndImpersonation's doc comment.
    }

    await tx.impersonationSession.update({
      where: { id: sessionId },
      data: { endedAt: now, endedReason: reason ?? null },
    });

    await buildAdminActionOperation(
      {
        adminUserId,
        action: "IMPERSONATE_END",
        targetType: "USER",
        targetId: existing.targetUserId,
        impersonationSessionId: existing.id,
        note: reason,
      },
      tx
    );
  });
}

// ============================================================================
// Resolve — the real gate consumed by lib/auth/seeker-session.ts and
// lib/auth/employer-session.ts.
// ============================================================================

export type ResolvedImpersonationTarget = {
  id: string;
  role: Role;
  /** Best-effort display name for the banner — seeker's full name, else the company's name, else the account email. Never undefined so the banner always has something to render. */
  name: string;
  email: string;
};

export type ActiveImpersonation = {
  sessionId: string;
  adminUserId: string;
  target: ResolvedImpersonationTarget;
  expiresAt: Date;
};

/**
 * The authoritative check. Returns non-null ONLY when ALL of the following
 * hold, per the task spec:
 *  1. the cookie's signature verifies and its own embedded expiry has not
 *     passed (lib/admin/impersonation-token.ts's verifyImpersonationToken);
 *  2. the `ImpersonationSession` row exists, `endedAt IS NULL`, and
 *     `expiresAt > now` (isSessionActive, re-checked against the DB row —
 *     the token's own expiry is not trusted as a substitute for the DB's);
 *  3. the admin STILL holds the `impersonate` permission right now — a
 *     demotion mid-session kills the session immediately, not at TTL.
 *
 * `cache()`-scoped per request, same convention as `getCachedAdminAccess` in
 * lib/auth/admin-session.ts — the layout and every page under it that also
 * calls this within one request share one resolution instead of one
 * cookie-verify-plus-two-queries each.
 */
export const resolveActiveImpersonation = cache(async (): Promise<ActiveImpersonation | null> => {
  const cookieStore = await cookies();
  const raw = cookieStore.get(IMPERSONATION_COOKIE_NAME)?.value;

  const payload = await verifyImpersonationToken(raw);
  if (!payload) return null;

  const session = await prisma.impersonationSession.findUnique({ where: { id: payload.sessionId } });
  if (!session) return null;

  const now = new Date();
  if (!isSessionActive(session, now)) return null;

  const access = await loadResolvedAdminAccess(session.adminUserId);
  if (!hasPermission(access, "impersonate")) return null;

  const targetUser = await prisma.user.findUnique({
    where: { id: session.targetUserId },
    select: {
      id: true,
      role: true,
      email: true,
      seekerProfile: { select: { fullName: true } },
      company: { select: { companyName: true } },
    },
  });
  if (!targetUser) return null;

  const name = targetUser.seekerProfile?.fullName || targetUser.company?.companyName || targetUser.email;

  return {
    sessionId: session.id,
    adminUserId: session.adminUserId,
    target: { id: targetUser.id, role: targetUser.role, name, email: targetUser.email },
    expiresAt: session.expiresAt,
  };
});
