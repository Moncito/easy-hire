import type { AdminLevel, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";
import { buildAdminActionOperation } from "@/lib/admin/audit";
import { adminTeamCreateSchema, adminTeamUpdateSchema } from "@/lib/validations/admin";

/**
 * ADMIN RBAC — docs/ADMIN-CONSOLE-PLAN.md §6.7 (admin roles) and §8.1
 * (access control). Pulled forward out of phase order (originally Phase 5,
 * §11) because Phase 2 shipped admin-initiated account deletion (the
 * irreversible RA 10173 anonymisation path, `deleteUserAccountAsAdmin` in
 * lib/account/account-deletion.ts) with no gate beyond `Role.ADMIN` — any
 * admin could delete any other admin. This module closes that gap.
 * ============================================================================
 * `AdminProfile { userId, level: AdminLevel, permissions: String[] }` and
 * `enum AdminLevel { SUPPORT | MODERATOR | FINANCE | SUPER_ADMIN }` already
 * exist in prisma/schema.prisma (Phase 0) and were referenced by zero code
 * until this module. No schema change here — no new table, column, enum, or
 * migration.
 *
 * Two things this file is NOT:
 *  - It does not replace `requireAdmin` (lib/auth/admin-guards.ts) — that
 *    stays the `Role.ADMIN` gate into `/admin` at all. This module answers a
 *    narrower question: given an already-admin user, what may they do.
 *  - It is not the only enforcement point. Per §8.1 ("a missing route guard
 *    should not be the only thing between a support admin and the revenue
 *    screen"), the assertion helpers below are called from BOTH the route
 *    handlers (defence in depth) AND the /lib functions that actually
 *    perform the sensitive operation (the real gate).
 */

// ============================================================================
// Permission vocabulary — single source of truth, same shape/discipline as
// `PLATFORM_EVENT_TYPES` in lib/admin/events.ts: a whitelist enforced at
// runtime (isAdminPermission below), not only encoded in the TypeScript type.
// ============================================================================

export const ADMIN_PERMISSIONS = [
  /** Approve/reject in the moderation queues, single-item and bulk. */
  "queue.decide",
  /** The 360-degree user/company record (lib/admin/users.ts's getUserRecord, lib/admin/companies.ts's getCompanyDetail). */
  "user.read",
  /** Low-risk support actions: password reset, resend verification. */
  "user.support",
  /** The irreversible RA 10173 anonymisation delete. SUPER_ADMIN only — see SUPER_ADMIN_ONLY_PERMISSIONS below. */
  "user.delete",
  /** ID and verification documents (§8.3 PII) — signed-URL reads, e.g. lib/admin/queue-detail.ts's getQueueItemDetail. */
  "document.view",
  /** Admin profile CRUD (this module's own create/update/revoke functions). SUPER_ADMIN only. */
  "team.manage",
  /** Nothing uses this yet (Phase 6) — defined now so the gate exists before the revenue screen does. */
  "revenue.read",
  /** Phase 3 — vendor/AI cost screens. */
  "cost.read",
] as const;

export type AdminPermission = (typeof ADMIN_PERMISSIONS)[number];

const ADMIN_PERMISSION_SET: ReadonlySet<string> = new Set(ADMIN_PERMISSIONS);

/** Runtime whitelist check — mirrors PLATFORM_EVENT_TYPE_SET's role in lib/admin/events.ts. Used to reject unrecognized strings arriving in `AdminProfile.permissions` (a plain `String[]` at the schema level) rather than trusting the DB to only ever contain valid values. */
export function isAdminPermission(value: string): value is AdminPermission {
  return ADMIN_PERMISSION_SET.has(value);
}

/**
 * Permissions that may ONLY ever be held by SUPER_ADMIN, per the task spec
 * ("user.delete — SUPER_ADMIN only", "team.manage — SUPER_ADMIN only"). This
 * is enforced two ways: `LEVEL_PERMISSIONS` never grants either to a
 * non-SUPER_ADMIN level by default, AND `effectivePermissions` below strips
 * them back out even if they somehow end up in a non-SUPER_ADMIN admin's
 * additive `permissions` array (a defensive floor, not just a UI default —
 * a stray/malicious additive grant must not be able to hand out either one).
 */
const SUPER_ADMIN_ONLY_PERMISSIONS: ReadonlySet<AdminPermission> = new Set(["user.delete", "team.manage"]);

// ============================================================================
// Level -> default permission set. ONE place, per the task spec ("Read the
// level→permissions mapping from one place so it can be audited at a
// glance"). `AdminLevel`'s declaration order in prisma/schema.prisma
// (SUPPORT, MODERATOR, FINANCE, SUPER_ADMIN) is treated as lowest-to-highest
// privilege — SUPPORT is therefore the level a missing profile row resolves
// to post-bootstrap (see resolveAdminAccess below).
// ============================================================================

const LEVEL_PERMISSIONS: Record<AdminLevel, readonly AdminPermission[]> = {
  // Front-line support: look up an account and act on the two lowest-risk
  // support actions, and view ID/verification documents when a ticket
  // requires confirming identity. No queue-decide (not a moderator), no
  // money, no team management.
  SUPPORT: ["user.read", "user.support", "document.view"],
  // Queue reviewers: decide in the moderation queues, and see the documents
  // the side-by-side review pane shows. Also reads user context (§4.2's
  // queue detail surfaces the account behind the item under review).
  MODERATOR: ["queue.decide", "user.read", "document.view"],
  // Money-adjacent: revenue/cost screens once they exist (Phase 6/3), plus
  // read access to look up the account behind a billing question. No queue
  // moderation, no ID documents, no team management.
  FINANCE: ["user.read", "revenue.read", "cost.read"],
  // Everything, including the two SUPER_ADMIN-only permissions.
  SUPER_ADMIN: [...ADMIN_PERMISSIONS],
};

/** Lowest privilege level — what an admin with no `AdminProfile` row resolves to once bootstrap mode has ended (see resolveAdminAccess). Exported so callers/tests reference the same constant rather than a re-typed literal. */
export const LOWEST_ADMIN_LEVEL: AdminLevel = "SUPPORT";

/** Read-only view of the level→permission mapping, e.g. for an admin-team UI to show "what does MODERATOR get by default" without duplicating the table. */
export function defaultPermissionsForLevel(level: AdminLevel): readonly AdminPermission[] {
  return LEVEL_PERMISSIONS[level];
}

/**
 * Level defaults plus additive per-user grants, with the SUPER_ADMIN-only
 * floor enforced regardless of what's in `additive`. Unknown strings in
 * `additive` (not on the ADMIN_PERMISSIONS whitelist) are silently dropped —
 * `AdminProfile.permissions` is a plain `String[]` at the schema level, so
 * this is the runtime enforcement the type system can't provide.
 */
function effectivePermissions(level: AdminLevel, additive: readonly string[]): ReadonlySet<AdminPermission> {
  const result = new Set<AdminPermission>(LEVEL_PERMISSIONS[level]);
  for (const raw of additive) {
    if (!isAdminPermission(raw)) continue;
    if (SUPER_ADMIN_ONLY_PERMISSIONS.has(raw) && level !== "SUPER_ADMIN") continue;
    result.add(raw);
  }
  return result;
}

// ============================================================================
// Resolution — bootstrap fallback vs. lowest-privilege fallback.
// ============================================================================

export type ResolvedAdminAccess = {
  userId: string;
  level: AdminLevel;
  permissions: ReadonlySet<AdminPermission>;
  /**
   * True only while `AdminProfile` has zero rows in the entire table. In
   * that state every `Role.ADMIN` user resolves to SUPER_ADMIN so the only
   * existing operator is never locked out of their own console the moment
   * this ships. The INSTANT one row exists anywhere — for anyone — this
   * flips to false for everyone, and a user with no row of their own then
   * resolves to `LOWEST_ADMIN_LEVEL`, never to SUPER_ADMIN. Callers (e.g.
   * the admin layout) can surface this to warn "you are running with no
   * admin-team configuration yet."
   */
  isBootstrap: boolean;
};

/**
 * Pure — no DB access, cheap to unit test (same convention as
 * `assertCanDeleteOwnedCompany` in lib/account/account-deletion.ts). Takes
 * the profile row (or null) and the table-wide row count as plain inputs so
 * callers can pass in whatever they already fetched instead of this
 * function re-querying.
 */
export function resolveAdminAccess(input: {
  userId: string;
  profile: { level: AdminLevel; permissions: readonly string[] } | null;
  /** `AdminProfile.count()` across the WHOLE table, not scoped to this user — this is what distinguishes bootstrap mode from "this particular admin has no row yet." */
  totalAdminProfileCount: number;
}): ResolvedAdminAccess {
  const { userId, profile, totalAdminProfileCount } = input;

  if (totalAdminProfileCount === 0) {
    // Bootstrap mode: see the isBootstrap doc comment above. Every
    // Role.ADMIN user is SUPER_ADMIN here, not just the one who happens to
    // be signed in — there is no row to distinguish "the real operator" from
    // anyone else with Role.ADMIN yet, and requireAdmin already gated that.
    return { userId, level: "SUPER_ADMIN", permissions: new Set(ADMIN_PERMISSIONS), isBootstrap: true };
  }

  if (!profile) {
    return { userId, level: LOWEST_ADMIN_LEVEL, permissions: effectivePermissions(LOWEST_ADMIN_LEVEL, []), isBootstrap: false };
  }

  return {
    userId,
    level: profile.level,
    permissions: effectivePermissions(profile.level, profile.permissions),
    isBootstrap: false,
  };
}

/** DB-backed wrapper around `resolveAdminAccess` — the two reads run in parallel, one row lookup plus one table-wide count. */
export async function loadResolvedAdminAccess(userId: string): Promise<ResolvedAdminAccess> {
  const [profile, totalAdminProfileCount] = await Promise.all([
    prisma.adminProfile.findUnique({ where: { userId }, select: { level: true, permissions: true } }),
    prisma.adminProfile.count(),
  ]);
  return resolveAdminAccess({ userId, profile, totalAdminProfileCount });
}

// ============================================================================
// Assertion helpers — the enforcement primitives. Called from route handlers
// (defence in depth) AND from the /lib functions that perform the operation
// (the real gate) — see this module's doc comment.
// ============================================================================

export function hasPermission(access: ResolvedAdminAccess, permission: AdminPermission): boolean {
  return access.permissions.has(permission);
}

export function assertPermission(access: ResolvedAdminAccess, permission: AdminPermission): void {
  if (!hasPermission(access, permission)) {
    throw new ApiError(`Forbidden — missing the "${permission}" admin permission.`, 403);
  }
}

/**
 * Convenience: resolve `userId`'s access and assert `permission` in one
 * call, for /lib functions that only have an admin user id in hand (every
 * decision function in lib/admin/{companies,jobs,seekers}.ts and
 * lib/reviews.ts, lib/admin/queue-detail.ts, lib/admin/users.ts). Returns
 * the resolved access so a caller that also wants `isBootstrap` or the
 * level doesn't have to fetch it twice.
 */
export async function requireAdminPermission(userId: string, permission: AdminPermission): Promise<ResolvedAdminAccess> {
  const access = await loadResolvedAdminAccess(userId);
  assertPermission(access, permission);
  return access;
}

// ============================================================================
// Failure mode 1 — self-escalation. An admin must never change their own
// level or permissions, even a SUPER_ADMIN (task spec, verbatim).
// ============================================================================

/**
 * Pure — no DB access, cheap to unit test (same style as
 * `assertCanDeleteOwnedCompany`). `allowBootstrapSelfInit` is a single
 * narrow exception: the bootstrap operator (zero `AdminProfile` rows exist
 * at all) creating THEIR OWN first row at SUPER_ADMIN is not an escalation —
 * they already resolve to SUPER_ADMIN with no row at all (see
 * resolveAdminAccess) — it is formalising a level they already effectively
 * hold, and it is what lets them exit bootstrap mode without immediately
 * locking themselves out the moment they create anyone else's row (once any
 * row exists, a missing row resolves to the LOWEST level, not the highest —
 * see the isBootstrap doc comment). Every other self-targeted create,
 * update, or revoke — including a bootstrap admin creating their own row at
 * anything other than SUPER_ADMIN — is refused. Callers decide when that
 * exception applies (`createOrAssignAdminProfile` below); this function
 * itself makes no DB call, so it cannot look that up on its own.
 */
export function assertSelfTeamActionAllowed(input: {
  actorUserId: string;
  targetUserId: string;
  allowBootstrapSelfInit: boolean;
}): void {
  if (input.actorUserId !== input.targetUserId) return;
  if (input.allowBootstrapSelfInit) return;
  throw new ApiError("You cannot change your own admin level or permissions.", 403);
}

// ============================================================================
// Failure mode 2 — last-super-admin lockout. The final remaining SUPER_ADMIN
// must not be demotable or deletable.
// ============================================================================

export type LastSuperAdminGuardInput = {
  /** Whether the row being changed is CURRENTLY SUPER_ADMIN (before the write). */
  targetIsCurrentSuperAdmin: boolean;
  /** Count of OTHER SUPER_ADMIN profiles — i.e. excluding the target row — read inside the SAME transaction as the write that follows this check (see updateAdminProfile/revokeAdminProfile below for why plain read-committed isn't enough on its own). */
  otherSuperAdminCount: number;
  operation: "demote" | "revoke";
};

/** Pure — no DB access, cheap to unit test. The DB-facing callers are responsible for the "count and write in one transaction" half of the task spec; this function is only the decision once that count is in hand. */
export function assertLastSuperAdminSafe(input: LastSuperAdminGuardInput): void {
  if (!input.targetIsCurrentSuperAdmin) return;
  if (input.otherSuperAdminCount > 0) return;
  const verb = input.operation === "demote" ? "demoted" : "revoked";
  throw new ApiError(`The last remaining SUPER_ADMIN cannot be ${verb}.`, 409);
}

// ============================================================================
// Team CRUD — GET/POST /api/admin/team, PATCH/DELETE /api/admin/team/[id].
// All three mutations require `team.manage` (SUPER_ADMIN only) and write an
// awaited audit row (a decision, not a read — see recordAdminAction's doc
// comment in lib/admin/audit.ts for why this is NOT the fire-and-forget
// recordPiiRead path).
// ============================================================================

export type AdminTeamMember = {
  userId: string;
  email: string;
  level: AdminLevel;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
};

/** Every `Role.ADMIN` user, left-joined against `AdminProfile` so a not-yet-assigned admin (resolving to LOWEST_ADMIN_LEVEL per resolveAdminAccess) is visible too, not just the ones with a row. Small population by construction — admins are not a directory-scale list — so a plain `findMany` (no cursor pagination) is appropriate here, same judgment call as `listCompaniesForCollaborativeHiring` in lib/admin/companies.ts. */
export async function listAdminTeam(actorUserId: string): Promise<{ members: AdminTeamMember[]; isBootstrap: boolean }> {
  const access = await requireAdminPermission(actorUserId, "team.manage");

  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: {
      id: true,
      email: true,
      adminProfile: { select: { level: true, permissions: true, createdAt: true, updatedAt: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const members: AdminTeamMember[] = admins.map((admin) => ({
    userId: admin.id,
    email: admin.email,
    level: admin.adminProfile?.level ?? LOWEST_ADMIN_LEVEL,
    permissions: admin.adminProfile ? [...admin.adminProfile.permissions] : [],
    createdAt: admin.adminProfile?.createdAt ?? new Date(0),
    updatedAt: admin.adminProfile?.updatedAt ?? new Date(0),
  }));

  return { members, isBootstrap: access.isBootstrap };
}

/**
 * Creates (or reassigns, if a caller re-POSTs for an existing row — see the
 * upsert below) an `AdminProfile`. The target must already be `Role.ADMIN` —
 * per §6.7, `Role.ADMIN` stays the gate into `/admin`; `AdminProfile.level`
 * only gates what an already-admin user sees inside it. This is not a way to
 * promote a non-admin user to admin.
 */
export async function createOrAssignAdminProfile(actorUserId: string, raw: unknown): Promise<AdminTeamMember> {
  const access = await requireAdminPermission(actorUserId, "team.manage");
  const input = adminTeamCreateSchema.parse(raw);

  const allowBootstrapSelfInit = access.isBootstrap && input.level === "SUPER_ADMIN";
  assertSelfTeamActionAllowed({
    actorUserId,
    targetUserId: input.userId,
    allowBootstrapSelfInit,
  });

  const target = await prisma.user.findUnique({ where: { id: input.userId }, select: { id: true, email: true, role: true } });
  if (!target) {
    throw new ApiError("User not found", 404);
  }
  if (target.role !== "ADMIN") {
    throw new ApiError("Only a Role.ADMIN user may be assigned an admin profile.", 400);
  }

  // Unknown permission strings are rejected outright here (a 400, not a
  // silent drop) — unlike `effectivePermissions`'s silent-drop behaviour for
  // whatever might already be sitting in a DB row, a fresh write is exactly
  // the moment to refuse bad input rather than quietly ignore it.
  const permissions = input.permissions ?? [];
  for (const permission of permissions) {
    if (!isAdminPermission(permission)) {
      throw new ApiError(`Unrecognized admin permission: "${permission}".`, 400);
    }
  }

  const existing = await prisma.adminProfile.findUnique({ where: { userId: input.userId }, select: { id: true } });
  if (existing) {
    throw new ApiError("This user already has an admin profile — use PATCH to change it.", 409);
  }

  const created = await prisma.adminProfile.create({
    data: { userId: input.userId, level: input.level, permissions },
  });

  await recordAdminTeamAction({
    adminUserId: actorUserId,
    action: "ADMIN_TEAM_PROFILE_CREATED",
    targetUserId: input.userId,
    before: null,
    after: { level: created.level, permissions: created.permissions },
  });

  return {
    userId: target.id,
    email: target.email,
    level: created.level,
    permissions: created.permissions,
    createdAt: created.createdAt,
    updatedAt: created.updatedAt,
  };
}

/**
 * Updates level and/or permissions on an existing `AdminProfile`. Runs
 * SERIALIZABLE with retry — same pattern, and same underlying reason, as
 * `runSerializable` in lib/reviews.ts: a plain read-committed "count other
 * SUPER_ADMINs, then write" has a write-skew hole where two concurrent
 * demotions of the last two SUPER_ADMINs can each read "one other
 * SUPER_ADMIN still exists" before either write commits, and both pass,
 * leaving zero. SERIALIZABLE detects that read-write dependency cycle and
 * aborts one transaction (Prisma P2034); the retry loop re-runs it, and on
 * the second pass it correctly sees the other side's committed demotion and
 * refuses.
 */
export async function updateAdminProfile(actorUserId: string, targetUserId: string, raw: unknown): Promise<AdminTeamMember> {
  await requireAdminPermission(actorUserId, "team.manage");
  assertSelfTeamActionAllowed({ actorUserId, targetUserId, allowBootstrapSelfInit: false });

  const input = adminTeamUpdateSchema.parse(raw);

  if (input.permissions) {
    for (const permission of input.permissions) {
      if (!isAdminPermission(permission)) {
        throw new ApiError(`Unrecognized admin permission: "${permission}".`, 400);
      }
    }
  }

  const target = await prisma.user.findUnique({ where: { id: targetUserId }, select: { email: true } });
  if (!target) {
    throw new ApiError("User not found", 404);
  }

  const updated = await runSerializable(async (tx) => {
    const existing = await tx.adminProfile.findUnique({ where: { userId: targetUserId } });
    if (!existing) {
      throw new ApiError("This user has no admin profile yet — use POST to create one.", 404);
    }

    const nextLevel = input.level ?? existing.level;
    const isDemotionFromSuperAdmin = existing.level === "SUPER_ADMIN" && nextLevel !== "SUPER_ADMIN";

    if (isDemotionFromSuperAdmin) {
      const otherSuperAdminCount = await tx.adminProfile.count({
        where: { level: "SUPER_ADMIN", userId: { not: targetUserId } },
      });
      assertLastSuperAdminSafe({ targetIsCurrentSuperAdmin: true, otherSuperAdminCount, operation: "demote" });
    }

    const before = { level: existing.level, permissions: existing.permissions };

    const row = await tx.adminProfile.update({
      where: { userId: targetUserId },
      data: {
        ...(input.level !== undefined ? { level: input.level } : {}),
        ...(input.permissions !== undefined ? { permissions: input.permissions } : {}),
      },
    });

    await buildAdminActionOperation(
      {
        adminUserId: actorUserId,
        action: "ADMIN_TEAM_LEVEL_CHANGED",
        targetType: "ADMIN_PROFILE",
        targetId: targetUserId,
        before,
        after: { level: row.level, permissions: row.permissions },
      },
      tx
    );

    return row;
  });

  return {
    userId: targetUserId,
    email: target.email,
    level: updated.level,
    permissions: updated.permissions,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt,
  };
}

/**
 * Removes an `AdminProfile` row entirely — the target falls back to
 * LOWEST_ADMIN_LEVEL (post-bootstrap) the next time their access is
 * resolved. Same SERIALIZABLE-with-retry treatment as updateAdminProfile,
 * for the identical last-SUPER_ADMIN write-skew reason.
 */
export async function revokeAdminProfile(actorUserId: string, targetUserId: string): Promise<{ revoked: true }> {
  await requireAdminPermission(actorUserId, "team.manage");
  assertSelfTeamActionAllowed({ actorUserId, targetUserId, allowBootstrapSelfInit: false });

  await runSerializable(async (tx) => {
    const existing = await tx.adminProfile.findUnique({ where: { userId: targetUserId } });
    if (!existing) {
      throw new ApiError("This user has no admin profile to revoke.", 404);
    }

    if (existing.level === "SUPER_ADMIN") {
      const otherSuperAdminCount = await tx.adminProfile.count({
        where: { level: "SUPER_ADMIN", userId: { not: targetUserId } },
      });
      assertLastSuperAdminSafe({ targetIsCurrentSuperAdmin: true, otherSuperAdminCount, operation: "revoke" });
    }

    await tx.adminProfile.delete({ where: { userId: targetUserId } });

    await buildAdminActionOperation(
      {
        adminUserId: actorUserId,
        action: "ADMIN_TEAM_PROFILE_REVOKED",
        targetType: "ADMIN_PROFILE",
        targetId: targetUserId,
        before: { level: existing.level, permissions: existing.permissions },
        after: undefined,
      },
      tx
    );
  });

  return { revoked: true };
}

// ============================================================================
// Internal helpers
// ============================================================================

/** Thin wrapper so the three team-CRUD functions above share one call shape for their audit write, matching `buildAdminActionOperation`'s field names 1:1. */
async function recordAdminTeamAction(input: {
  adminUserId: string;
  action: "ADMIN_TEAM_PROFILE_CREATED" | "ADMIN_TEAM_LEVEL_CHANGED" | "ADMIN_TEAM_PROFILE_REVOKED";
  targetUserId: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
}): Promise<void> {
  await buildAdminActionOperation({
    adminUserId: input.adminUserId,
    action: input.action,
    targetType: "ADMIN_PROFILE",
    targetId: input.targetUserId,
    before: input.before ?? undefined,
    after: input.after ?? undefined,
  });
}

const SERIALIZABLE_MAX_ATTEMPTS = 5;

function isSerializationFailure(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2034"
  );
}

/**
 * Same retry-on-P2034 shape as `runSerializable` in lib/reviews.ts (not
 * imported from there — that copy is private to the review-reveal race and
 * this module has no dependency on lib/reviews.ts). See
 * `updateAdminProfile`'s doc comment for exactly which race this prevents.
 */
async function runSerializable<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= SERIALIZABLE_MAX_ATTEMPTS; attempt++) {
    try {
      return await prisma.$transaction(fn, { isolationLevel: "Serializable" });
    } catch (error) {
      lastError = error;
      if (!isSerializationFailure(error)) throw error;
      await new Promise((resolve) => setTimeout(resolve, 10 * attempt + Math.floor(Math.random() * 20)));
    }
  }
  throw lastError;
}
