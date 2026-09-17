import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/lib/admin/permissions";
import { QUEUE_RANKING } from "@/lib/admin/queues";
import { TRUST_WEIGHTS, type TrustComponent, type TrustComputation } from "@/lib/admin/trust";

/**
 * Read surface over the trust scores `lib/admin/trust.ts` already computes
 * and persists nightly (docs/ADMIN-CONSOLE-PLAN.md §4.8, §6.6, §11 Phase 4).
 * This module does NOT recompute, re-weight, or duplicate any scoring logic
 * — it only lists `SeekerProfile`/`Company` rows by their already-stored
 * `trustScore`/`trustScoreUpdatedAt`/`trustSignals`, joined against each
 * account's own count of OPEN abuse reports so the two halves of Phase 4
 * (trust scoring + abuse reporting) read as one screen.
 *
 * PHASE 4's GATE: "a risky account surfaces before a human reports it"
 * (§11). That makes the default ordering — lowest score first — the
 * feature, not a UI detail: this module has no "sort by" option, on
 * purpose, because a directory an operator has to remember to re-sort is
 * one that silently reverts to hiding risk on the next visit.
 */

export type TrustDirectoryTargetType = "SEEKER" | "COMPANY";

/** Cursor is (trustScore, id) — the ranked list's own sort key, same "cursor is the sort key" convention as `QueueCursor` in lib/admin/queues.ts. */
export type TrustDirectoryCursor = { trustScore: number; id: string };

export function encodeTrustDirectoryCursor(cursor: TrustDirectoryCursor): string {
  return Buffer.from(JSON.stringify({ trustScore: cursor.trustScore, id: cursor.id }), "utf8").toString("base64url");
}

export function decodeTrustDirectoryCursor(raw: string): TrustDirectoryCursor | null {
  try {
    const parsed = JSON.parse(Buffer.from(raw, "base64url").toString("utf8"));
    if (typeof parsed?.trustScore !== "number" || typeof parsed?.id !== "string") return null;
    return { trustScore: parsed.trustScore, id: parsed.id };
  } catch {
    return null;
  }
}

/**
 * `trustScore: number`, never `number | null` — deliberately. `lib/admin/trust.ts`'s
 * own Rule 1 is that a missing signal is never a penalty, so an account that
 * has never been scored must never be indistinguishable from — or ranked
 * alongside — one scored at rock bottom. Rather than carry a nullable score
 * through this type and rely on every caller remembering to check it, the
 * ranked list below is queried with `trustScore: { not: null }` and this
 * type simply has no null to check: every row that reaches the UI has a
 * real score. Never-scored accounts are counted (`neverScoredCount` on
 * `TrustDirectoryResult`) but never listed in the ranked page — see that
 * field's own doc comment.
 */
export type TrustDirectoryRow = {
  id: string;
  userId: string;
  displayName: string;
  trustScore: number;
  trustScoreUpdatedAt: Date;
  /**
   * The stored `trustSignals` JSON, typed back to the real `TrustComputation`
   * shape `lib/admin/trust.ts` wrote — this is what lets the UI explain WHY
   * a score is low without re-deriving anything. `null` only if the column
   * itself is null (should not happen alongside a non-null `trustScore`,
   * since both are written together by `writeTrustResults`) or if the
   * stored JSON does not match the expected shape (`isTrustComputation`
   * below) — a defensive fallback for a JSON column that carries no schema
   * guarantee at the database level, not an expected runtime state.
   */
  trustSignals: TrustComputation | null;
  /** Count of this account's OPEN `AbuseReport` rows — the join between the two halves of Phase 4. ACTIONED reports are not counted here; they already moved the trust score itself (see `TRUST_WEIGHTS.seeker.abuseReports`/`.employer.abuseReports`), and counting them again here would be the same signal shown twice. */
  openAbuseReportCount: number;
};

export type TrustDirectoryResult = {
  rows: TrustDirectoryRow[];
  nextCursor: TrustDirectoryCursor | null;
  /** Total accounts of this type with a non-null `trustScore` — the population the ranked list is paging through. */
  scoredCount: number;
  /**
   * Accounts of this type with `trustScore IS NULL` — never scored (no
   * `PlatformEvent` activity yet, so `recomputeTrustScores`'s candidate
   * selection has never picked them up). Surfaced as a count so the screen
   * can say "N accounts have no score yet" honestly, WITHOUT mixing them
   * into the ranked list — see `TrustDirectoryRow.trustScore`'s doc comment
   * for why they are excluded from that list entirely rather than sorted to
   * either end of it.
   */
  neverScoredCount: number;
  /** Accounts of this type with `trustScore < RISK_THRESHOLD` — the same cutoff `lib/admin/queues.ts`'s `lowTrustScore` severity signal already uses, reused verbatim (see `RISK_THRESHOLD` below) rather than a second number, so "risky" means the same thing in the queue and in this directory. An aggregate COUNT, not `rows.length` — the ranked page can be smaller than this count once pagination is in play. */
  belowThresholdCount: number;
  /**
   * Score-distribution histogram for this `targetType` — four bands over the
   * exact same scored population `scoredCount` counts (never-scored accounts
   * excluded, same as the ranked list itself), so the four fields always sum
   * to `scoredCount` exactly. Bucketed on the two cutoffs already canonical
   * in this codebase rather than invented ones: `RISK_THRESHOLD` (40, see
   * above) and `BASELINE` (60, `TRUST_WEIGHTS.baseline` in lib/admin/trust.ts
   * — the score a freshly-scored account starts from before any component
   * moves it). `belowThreshold` is the exact same population as
   * `belowThresholdCount` above (not recomputed with a second query — see
   * `listSeekerTrustDirectory`/`listCompanyTrustDirectory`).
   */
  scoreDistribution: TrustScoreDistribution;
};

/**
 * Four bands, lowest to highest: `< RISK_THRESHOLD`, `[RISK_THRESHOLD, BASELINE)`,
 * `[BASELINE, EXCELLENT_THRESHOLD)`, `>= EXCELLENT_THRESHOLD`. See
 * `TrustDirectoryResult.scoreDistribution`'s doc comment for the cutoffs'
 * provenance.
 */
export type TrustScoreDistribution = {
  belowThreshold: number;
  belowBaseline: number;
  atOrAboveBaseline: number;
  excellent: number;
};

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;

/**
 * The "risky" line. Reused verbatim from lib/admin/queues.ts's
 * `QUEUE_RANKING.severity.lowTrustScore.threshold` rather than a second,
 * independently-tunable constant — a queue item and a directory row can
 * describe the exact same account, and "risky" should not mean two
 * different score cutoffs depending which screen you're looking at it from.
 */
const RISK_THRESHOLD = QUEUE_RANKING.severity.lowTrustScore.threshold;

/**
 * The score every freshly-scored account starts from before any component
 * adjusts it up or down — `TRUST_WEIGHTS.baseline` in lib/admin/trust.ts,
 * reused verbatim (not a second, independently-tunable number) as the
 * boundary between the distribution's "below baseline" and "at/above
 * baseline" bands.
 */
const BASELINE = TRUST_WEIGHTS.baseline;

/**
 * The distribution's top-band floor. Unlike `RISK_THRESHOLD`/`BASELINE`,
 * there is no existing "excellent" cutoff elsewhere in this codebase to
 * reuse, so this one is defined here, local to the histogram it buckets.
 */
const EXCELLENT_THRESHOLD = 80;

/**
 * Narrow, defensive check that a `Json` column's contents still look like a
 * `TrustComputation` — see `TrustDirectoryRow.trustSignals`'s doc comment.
 * Checks shape only, not that every number is in range; this is a guard
 * against a malformed/legacy payload, not a schema validator. Exported
 * (rather than kept module-private) so it is directly unit-testable without
 * a database — same "pure function, DB-free test" precedent as
 * `resolveAdminAccess` in lib/admin/permissions.ts.
 */
export function isTrustComputation(value: unknown): value is TrustComputation {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.score === "number" &&
    typeof v.baseline === "number" &&
    typeof v.weightsVersion === "number" &&
    typeof v.computedAt === "string" &&
    Array.isArray(v.components) &&
    v.components.every(
      (c): c is TrustComponent =>
        typeof c === "object" &&
        c !== null &&
        typeof (c as TrustComponent).key === "string" &&
        typeof (c as TrustComponent).contribution === "number"
    )
  );
}

export async function listTrustDirectory(
  adminUserId: string,
  params: {
    targetType: TrustDirectoryTargetType;
    cursor?: TrustDirectoryCursor;
    limit?: number;
  }
): Promise<TrustDirectoryResult> {
  await requireAdminPermission(adminUserId, "user.read");

  const limit = Math.min(Math.max(params.limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT);

  return params.targetType === "SEEKER"
    ? listSeekerTrustDirectory(params.cursor, limit)
    : listCompanyTrustDirectory(params.cursor, limit);
}

async function listSeekerTrustDirectory(
  cursor: TrustDirectoryCursor | undefined,
  limit: number
): Promise<TrustDirectoryResult> {
  const cursorFilter = cursor
    ? {
        OR: [
          { trustScore: { gt: cursor.trustScore } },
          { trustScore: cursor.trustScore, id: { gt: cursor.id } },
        ],
      }
    : {};

  const [
    profiles,
    scoredCount,
    neverScoredCount,
    belowThresholdCount,
    belowBaselineCount,
    atOrAboveBaselineCount,
    excellentCount,
  ] = await Promise.all([
    prisma.seekerProfile.findMany({
      where: { trustScore: { not: null }, ...cursorFilter },
      orderBy: [{ trustScore: "asc" }, { id: "asc" }],
      take: limit + 1,
      select: { id: true, userId: true, fullName: true, trustScore: true, trustScoreUpdatedAt: true, trustSignals: true },
    }),
    prisma.seekerProfile.count({ where: { trustScore: { not: null } } }),
    prisma.seekerProfile.count({ where: { trustScore: null } }),
    // `not: null` is redundant with SQL's NULL semantics (`trust_score < N`
    // is already unknown/excluded for a NULL row) but spelled out anyway —
    // this count backs a genuine trust/safety metric, and being explicit
    // here costs nothing while removing any doubt for the next reader. This
    // is also `scoreDistribution.belowThreshold` verbatim — see that field's
    // doc comment for why it isn't recomputed a second time below.
    prisma.seekerProfile.count({ where: { trustScore: { not: null, lt: RISK_THRESHOLD } } }),
    prisma.seekerProfile.count({ where: { trustScore: { gte: RISK_THRESHOLD, lt: BASELINE } } }),
    prisma.seekerProfile.count({ where: { trustScore: { gte: BASELINE, lt: EXCELLENT_THRESHOLD } } }),
    prisma.seekerProfile.count({ where: { trustScore: { gte: EXCELLENT_THRESHOLD } } }),
  ]);

  const hasMore = profiles.length > limit;
  const page = hasMore ? profiles.slice(0, limit) : profiles;
  const last = page[page.length - 1];

  // Abuse reports against a seeker are filed with `targetType: 'USER'` and
  // `targetId = User.id` (there is no separate 'SEEKER' target type — see
  // prisma/schema.prisma's AbuseReport comment and lib/admin/trust.ts's
  // identical join), NOT SeekerProfile.id — hence userIds here, not profile ids.
  const userIds = page.map((p) => p.userId);
  const openCounts = userIds.length
    ? await prisma.abuseReport.groupBy({
        by: ["targetId"],
        where: { targetType: "USER", targetId: { in: userIds }, status: "OPEN" },
        _count: { _all: true },
      })
    : [];
  const openCountByUserId = new Map(openCounts.map((r) => [r.targetId, r._count._all]));

  const rows: TrustDirectoryRow[] = page.map((p) => ({
    id: p.id,
    userId: p.userId,
    displayName: p.fullName,
    // Non-null by construction — the query above filters on `trustScore: { not: null }`.
    trustScore: p.trustScore as number,
    trustScoreUpdatedAt: p.trustScoreUpdatedAt as Date,
    trustSignals: isTrustComputation(p.trustSignals) ? p.trustSignals : null,
    openAbuseReportCount: openCountByUserId.get(p.userId) ?? 0,
  }));

  return {
    rows,
    nextCursor: hasMore && last ? { trustScore: last.trustScore as number, id: last.id } : null,
    scoredCount,
    neverScoredCount,
    belowThresholdCount,
    scoreDistribution: {
      belowThreshold: belowThresholdCount,
      belowBaseline: belowBaselineCount,
      atOrAboveBaseline: atOrAboveBaselineCount,
      excellent: excellentCount,
    },
  };
}

async function listCompanyTrustDirectory(
  cursor: TrustDirectoryCursor | undefined,
  limit: number
): Promise<TrustDirectoryResult> {
  const cursorFilter = cursor
    ? {
        OR: [
          { trustScore: { gt: cursor.trustScore } },
          { trustScore: cursor.trustScore, id: { gt: cursor.id } },
        ],
      }
    : {};

  const [
    companies,
    scoredCount,
    neverScoredCount,
    belowThresholdCount,
    belowBaselineCount,
    atOrAboveBaselineCount,
    excellentCount,
  ] = await Promise.all([
    prisma.company.findMany({
      where: { trustScore: { not: null }, ...cursorFilter },
      orderBy: [{ trustScore: "asc" }, { id: "asc" }],
      take: limit + 1,
      select: { id: true, userId: true, companyName: true, trustScore: true, trustScoreUpdatedAt: true, trustSignals: true },
    }),
    prisma.company.count({ where: { trustScore: { not: null } } }),
    prisma.company.count({ where: { trustScore: null } }),
    // Same `scoreDistribution.belowThreshold` reuse as the seeker query above.
    prisma.company.count({ where: { trustScore: { not: null, lt: RISK_THRESHOLD } } }),
    prisma.company.count({ where: { trustScore: { gte: RISK_THRESHOLD, lt: BASELINE } } }),
    prisma.company.count({ where: { trustScore: { gte: BASELINE, lt: EXCELLENT_THRESHOLD } } }),
    prisma.company.count({ where: { trustScore: { gte: EXCELLENT_THRESHOLD } } }),
  ]);

  const hasMore = companies.length > limit;
  const page = hasMore ? companies.slice(0, limit) : companies;
  const last = page[page.length - 1];

  // Abuse reports against a company are filed with `targetType: 'COMPANY'`
  // and `targetId = Company.id` directly (NOT Company.userId) — same join
  // lib/admin/trust.ts's employer batch uses.
  const companyIds = page.map((c) => c.id);
  const openCounts = companyIds.length
    ? await prisma.abuseReport.groupBy({
        by: ["targetId"],
        where: { targetType: "COMPANY", targetId: { in: companyIds }, status: "OPEN" },
        _count: { _all: true },
      })
    : [];
  const openCountByCompanyId = new Map(openCounts.map((r) => [r.targetId, r._count._all]));

  const rows: TrustDirectoryRow[] = page.map((c) => ({
    id: c.id,
    userId: c.userId,
    displayName: c.companyName,
    trustScore: c.trustScore as number,
    trustScoreUpdatedAt: c.trustScoreUpdatedAt as Date,
    trustSignals: isTrustComputation(c.trustSignals) ? c.trustSignals : null,
    openAbuseReportCount: openCountByCompanyId.get(c.id) ?? 0,
  }));

  return {
    rows,
    nextCursor: hasMore && last ? { trustScore: last.trustScore as number, id: last.id } : null,
    scoredCount,
    neverScoredCount,
    belowThresholdCount,
    scoreDistribution: {
      belowThreshold: belowThresholdCount,
      belowBaseline: belowBaselineCount,
      atOrAboveBaseline: atOrAboveBaselineCount,
      excellent: excellentCount,
    },
  };
}
