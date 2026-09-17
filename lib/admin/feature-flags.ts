import { createHash } from "crypto";
import type { FeatureFlag } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";
import { requireAdminPermission } from "@/lib/admin/permissions";
import { recordAdminAction } from "@/lib/admin/audit";
import {
  featureFlagCreateSchema,
  featureFlagKeySchema,
  featureFlagUpdateSchema,
} from "@/lib/validations/admin";

/**
 * FEATURE FLAGS — docs/ADMIN-CONSOLE-PLAN.md §4.10, `feature_flags` table
 * added in the Sprint 11 registry (docs/build-plan.md). Gated on
 * `system.read` (list) / `system.manage` (create/update/delete) at BOTH
 * layers — the route handlers under app/api/admin/feature-flags/* (defence
 * in depth) AND every exported function below via `requireAdminPermission`
 * (the real gate) — same discipline as lib/admin/permissions.ts's own
 * doc comment describes for team CRUD.
 * ============================================================================
 * `key` is plain TEXT at the schema level (`FeatureFlag.key`, unique), never
 * a Postgres enum, so shipping a new flag is a row, not a migration — same
 * reasoning as the reason-code vocabularies in lib/admin/reason-codes.ts.
 * `lib/validations/admin.ts`'s `featureFlagKeySchema` is the only guardrail
 * on its shape (lowercase, dot/hyphen/underscore-separated segments, bounded
 * length).
 */

// ============================================================================
// CRUD — each mutation writes an awaited audit row via `recordAdminAction`,
// same reliability contract as the team-CRUD functions in
// lib/admin/permissions.ts: a flag change that cannot be audited must not
// silently succeed.
// ============================================================================

export async function listFeatureFlags(adminUserId: string): Promise<FeatureFlag[]> {
  await requireAdminPermission(adminUserId, "system.read");
  return prisma.featureFlag.findMany({ orderBy: { key: "asc" } });
}

function flagAuditSnapshot(flag: FeatureFlag): Record<string, unknown> {
  return { description: flag.description, enabled: flag.enabled, rolloutPercentage: flag.rolloutPercentage };
}

export async function createFeatureFlag(adminUserId: string, raw: unknown): Promise<FeatureFlag> {
  await requireAdminPermission(adminUserId, "system.manage");
  const input = featureFlagCreateSchema.parse(raw);

  const existing = await prisma.featureFlag.findUnique({ where: { key: input.key } });
  if (existing) {
    throw new ApiError(`A feature flag with key "${input.key}" already exists.`, 409);
  }

  const created = await prisma.featureFlag.create({
    data: {
      key: input.key,
      description: input.description,
      enabled: input.enabled,
      rolloutPercentage: input.rolloutPercentage ?? null,
      updatedBy: adminUserId,
    },
  });

  await recordAdminAction({
    adminUserId,
    action: "FEATURE_FLAG_CREATED",
    targetType: "FEATURE_FLAG",
    targetId: created.key,
    after: flagAuditSnapshot(created),
  });

  return created;
}

export async function updateFeatureFlag(adminUserId: string, rawKey: string, raw: unknown): Promise<FeatureFlag> {
  await requireAdminPermission(adminUserId, "system.manage");
  const key = featureFlagKeySchema.parse(rawKey);
  const input = featureFlagUpdateSchema.parse(raw);

  const existing = await prisma.featureFlag.findUnique({ where: { key } });
  if (!existing) {
    throw new ApiError(`No feature flag with key "${key}".`, 404);
  }

  const updated = await prisma.featureFlag.update({
    where: { key },
    data: {
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.enabled !== undefined ? { enabled: input.enabled } : {}),
      ...(input.rolloutPercentage !== undefined ? { rolloutPercentage: input.rolloutPercentage } : {}),
      updatedBy: adminUserId,
    },
  });

  await recordAdminAction({
    adminUserId,
    action: "FEATURE_FLAG_UPDATED",
    targetType: "FEATURE_FLAG",
    targetId: key,
    before: flagAuditSnapshot(existing),
    after: flagAuditSnapshot(updated),
  });

  return updated;
}

export async function deleteFeatureFlag(adminUserId: string, rawKey: string): Promise<{ deleted: true }> {
  await requireAdminPermission(adminUserId, "system.manage");
  const key = featureFlagKeySchema.parse(rawKey);

  const existing = await prisma.featureFlag.findUnique({ where: { key } });
  if (!existing) {
    throw new ApiError(`No feature flag with key "${key}".`, 404);
  }

  await prisma.featureFlag.delete({ where: { key } });

  await recordAdminAction({
    adminUserId,
    action: "FEATURE_FLAG_DELETED",
    targetType: "FEATURE_FLAG",
    targetId: key,
    before: flagAuditSnapshot(existing),
  });

  return { deleted: true };
}

// ============================================================================
// Evaluation — the function the REST of the app calls (not gated on any
// admin permission; a flag check is a normal runtime read, not an admin
// action). No caller exists yet — this ships ahead of any flag-gated feature,
// same as `revenue.read` shipped ahead of the revenue screen.
// ============================================================================

/**
 * Deterministic bucket in `[0, 100)` for `(key, userId)`. NEVER
 * `Math.random()` — a percentage rollout that re-rolls on every request
 * would show a user a feature on one page load and hide it on the next,
 * which is worse for trust and for support tickets than no rollout at all.
 * Hashing `key + userId` means the same user always lands in the same
 * bucket for a given flag, and different flags bucket the same user
 * independently (so two 50% rollouts don't correlate with each other).
 *
 * Uses the first 4 bytes of a SHA-256 digest as an unsigned 32-bit integer,
 * reduced mod 100 — SHA-256 is already a project dependency-free primitive
 * (Node's `crypto`), and the bucket only needs to be well-distributed, not
 * cryptographically unpredictable.
 */
export function computeRolloutBucket(key: string, userId: string): number {
  const digest = createHash("sha256").update(`${key}:${userId}`).digest();
  return digest.readUInt32BE(0) % 100;
}

/**
 * Pure — no DB access, cheap to unit test. Callers pass in the flag's
 * already-loaded `rolloutPercentage`; this only answers "given that
 * percentage, is this (key, userId) inside the rollout." Does NOT check
 * `enabled` — that is `isFeatureEnabled`'s job, one level up, so this
 * function's contract is unambiguous: it is only ever asked once `enabled`
 * is already known to be true.
 *
 * - `rolloutPercentage === null` → true (no percentage gate at all).
 * - No `userId` → false. There is no identity to bucket deterministically,
 *   and falling back to a coin flip would make the flag flicker per request
 *   for anonymous traffic — worse than just not enabling it for them.
 * - Otherwise → true iff the deterministic bucket is below the percentage
 *   (`bucket < rolloutPercentage`), so 0 means "nobody" and 100 means
 *   "everybody" (bucket ranges over `[0, 100)`).
 */
export function isWithinRollout(key: string, userId: string | undefined, rolloutPercentage: number | null): boolean {
  if (rolloutPercentage === null) return true;
  if (!userId) return false;
  return computeRolloutBucket(key, userId) < rolloutPercentage;
}

/**
 * The flag-evaluation function the rest of the app calls. Contract:
 *   - No such flag, or `enabled: false` → false.
 *   - `enabled: true`, `rolloutPercentage: null` → true.
 *   - `enabled: true`, `rolloutPercentage` set → `isWithinRollout` above.
 */
export async function isFeatureEnabled(key: string, userId?: string): Promise<boolean> {
  const flag = await prisma.featureFlag.findUnique({ where: { key }, select: { key: true, enabled: true, rolloutPercentage: true } });
  if (!flag || !flag.enabled) return false;
  return isWithinRollout(flag.key, userId, flag.rolloutPercentage);
}
