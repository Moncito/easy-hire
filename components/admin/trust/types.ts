/**
 * Client-side (serialized) mirror of lib/admin/trust-directory.ts's
 * `TrustDirectoryRow` / `TrustDirectoryResult` — docs/ADMIN-CONSOLE-PLAN.md
 * §4.8. Same "Date -> ISO string" wire convention as every other admin
 * screen (see components/admin/directory/types.ts's header comment).
 *
 * `TrustComponent` is imported type-only from lib/admin/trust.ts — that file
 * also exports `TRUST_WEIGHTS`/scoring functions that pull in Prisma, so
 * only the type (erased at compile time, never bundled) is safe to pull into
 * this client-facing file.
 */
import type { TrustComponent } from "@/lib/admin/trust";

export type { TrustComponent };

export type TrustDirectoryTargetType = "SEEKER" | "COMPANY";

export type SerializedTrustComputation = {
  score: number;
  baseline: number;
  weightsVersion: number;
  computedAt: string;
  components: TrustComponent[];
};

export type SerializedTrustDirectoryRow = {
  id: string;
  userId: string;
  displayName: string;
  trustScore: number;
  trustScoreUpdatedAt: string;
  /**
   * `null` only if the stored `trustSignals` JSON doesn't match the expected
   * shape (see `isTrustComputation` in lib/admin/trust-directory.ts) — a
   * defensive fallback, not an expected state alongside a real `trustScore`.
   * The row itself is never hidden for this — the score still renders, just
   * without a component breakdown, and the UI says so rather than pretending
   * there's nothing to explain.
   */
  trustSignals: SerializedTrustComputation | null;
  /**
   * OPEN abuse reports against this account — the join between trust scoring
   * and the reports queue. ACTIONED reports already moved the score itself
   * (see TRUST_WEIGHTS.*.abuseReports), so they are deliberately not counted
   * here a second time.
   */
  openAbuseReportCount: number;
};

export type SerializedTrustDirectoryResult = {
  rows: SerializedTrustDirectoryRow[];
  nextCursor: string | null;
  /** Accounts of this type with a real (non-null) trust score — the population the ranked list below is paging through. */
  scoredCount: number;
  /**
   * Accounts of this type never yet scored (no activity for the nightly cron
   * to pick up). NEVER mixed into `rows` — see
   * lib/admin/trust-directory.ts's own doc comment on `TrustDirectoryRow.trustScore`
   * for why a never-scored account must not be indistinguishable from, or
   * ranked alongside, a real rock-bottom score. This count is the only place
   * a never-scored account is visible on this screen at all.
   */
  neverScoredCount: number;
  /** Accounts of this type scored below the shared "risky" cutoff (`QUEUE_RANKING.severity.lowTrustScore.threshold`) — an aggregate count, not `rows.length`, since the ranked page can be smaller than this count once pagination is in play. */
  belowThresholdCount: number;
};
