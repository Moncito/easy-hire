import { prisma } from "@/lib/prisma";
import { loadResolvedAdminAccess, hasPermission } from "@/lib/admin/permissions";
import {
  getQueueHealth,
  getDecisionStats,
  getRecentOverturns,
  type QueueHealth,
  type DecisionStats,
  type RecentOverturn,
} from "@/lib/admin/queues";
import {
  computeResponseRate72h,
  RESPONSE_METRICS_WINDOW_DAYS,
  type ResponseMetricsSample,
} from "@/lib/employer/response-metrics";
import type { PlatformDailyRollupMetrics } from "@/lib/admin/rollups";

/**
 * `/admin` HOME — docs/ADMIN-CONSOLE-PLAN.md §4.1. Three bands, in the
 * plan's own priority order — "Liquidity first, money second, queues third,
 * because a queue you can clear tells you nothing about whether the
 * business works."
 * ============================================================================
 * HONESTY DISCIPLINE — the load-bearing rule of this module, inherited
 * verbatim from lib/admin/rollups.ts's `queueDepths` doc comment and
 * lib/admin/system-health.ts's `SystemHealthMetric<T>`: every rate/median
 * here is `{ value, sampleSize } | null`, null exactly when the sample size
 * is zero — never a fabricated `0` that could be misread as "measured and
 * it's zero." Money (Band 2) has no data source at all (no payment provider,
 * no revenue schema — Phase 6, externally blocked), so it is a discriminated
 * union with exactly one member today, `{ status: "blocked"; reason }` —
 * structurally incapable of carrying a number, the same trick
 * `SystemHealthMetric<T>` uses for its four uninstrumented metrics.
 *
 * SOURCING — fill rate / median-time-to-first-applicant come from the
 * LATEST `platform_daily_rollups` ROW, never a live recomputation: per
 * rollups.ts's own module doc comment, "Charts must read
 * `platform_daily_rollups`, never the live tables — this file is the only
 * thing that's allowed to read the live tables for these numbers." The one
 * exception is `responseRate72h`, which is NOT part of the rollup schema
 * (see its own doc comment below for why this file computes it live instead
 * of extending rollups.ts).
 *
 * PERMISSIONS — see `getAdminHomeDashboard`'s doc comment for the exact
 * reasoning on what is (and is not) gated beyond "signed in as an admin".
 */

// ============================================================================
// Shared "sampled metric" shape — the null-vs-zero discipline in one type.
// ============================================================================

/** `null` exactly when `sampleSize` is 0 or the source rollup doesn't exist yet — never a fabricated 0. */
export type SampledMetric = { value: number; sampleSize: number } | null;

/** Single conversion point so every Band 1 rate/median goes through the identical null-vs-zero rule. */
export function toSampledMetric(value: number | null, sampleSize: number): SampledMetric {
  if (sampleSize <= 0 || value === null) return null;
  return { value, sampleSize };
}

// ============================================================================
// Band 1 — Marketplace pulse.
// ============================================================================

export type ActiveSupplyDemand = {
  activeSeekers: number;
  activeJobs: number;
  /** `activeSeekers / activeJobs` — null only when `activeJobs` is 0 (never divide by zero); this is a live gauge, so unlike the rate metrics above it is never null just for having a small sample. */
  ratio: number | null;
};

/**
 * Pure — no Prisma import, unit-testable in isolation. "Active seekers" =
 * discoverable supply, the exact `visibility IN (STANDARD, PUBLIC)` filter
 * already established as "visible to employers" by lib/employer/talent.ts
 * (a `HIDDEN` profile has opted out of the marketplace entirely, so it isn't
 * supply). "Active jobs" = the exact `status = ACTIVE AND company.verifiedStatus
 * = APPROVED` definition the old lib/admin/dashboard.ts's `publicLiveJobs`
 * used, and the public job board's own query — a job actually visible to
 * seekers right now.
 */
export function buildActiveSupplyDemand(activeSeekers: number, activeJobs: number): ActiveSupplyDemand {
  return {
    activeSeekers,
    activeJobs,
    ratio: activeJobs > 0 ? activeSeekers / activeJobs : null,
  };
}

async function computeActiveSupplyDemand(): Promise<ActiveSupplyDemand> {
  const [activeSeekers, activeJobs] = await Promise.all([
    prisma.seekerProfile.count({ where: { visibility: { in: ["STANDARD", "PUBLIC"] } } }),
    prisma.job.count({ where: { status: "ACTIVE", company: { verifiedStatus: "APPROVED" } } }),
  ]);
  return buildActiveSupplyDemand(activeSeekers, activeJobs);
}

export type MarketplacePulseTrendPoint = {
  date: Date;
  /** Exactly as stored in that day's `platform_daily_rollups` row — not recomputed. */
  fillRate: PlatformDailyRollupMetrics["fillRate"];
  medianTimeToFirstApplicantHours: PlatformDailyRollupMetrics["medianTimeToFirstApplicantHours"];
  signupsByRole: Record<string, number>;
  /** Sum of `signupsByRole`'s own values — a derived total of an already-stored breakdown, not a fabricated number. */
  signupsTotal: number;
};

const TREND_WINDOW_DAYS = 90;

/**
 * Last `TREND_WINDOW_DAYS` days of `platform_daily_rollups` — however many
 * rows actually exist. Does NOT pad, interpolate, or backfill missing days:
 * a pre-launch marketplace with 6 stored rows returns 6 points, not 90.
 */
async function getMarketplacePulseTrend(): Promise<MarketplacePulseTrendPoint[]> {
  const since = new Date(Date.now() - TREND_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const rows = await prisma.platformDailyRollup.findMany({
    where: { date: { gte: since } },
    orderBy: { date: "asc" },
    select: { date: true, metrics: true },
  });

  return rows.map((row) => {
    const metrics = row.metrics as unknown as PlatformDailyRollupMetrics;
    const signupsByRole = metrics.signupsByRole ?? {};
    const signupsTotal = Object.values(signupsByRole).reduce((sum, n) => sum + n, 0);
    return {
      date: row.date,
      fillRate: metrics.fillRate,
      medianTimeToFirstApplicantHours: metrics.medianTimeToFirstApplicantHours,
      signupsByRole,
      signupsTotal,
    };
  });
}

/** Latest stored rollup row, or `null` if the table is empty (e.g. the nightly cron hasn't run yet on a brand-new environment). */
async function getLatestRollupMetrics(): Promise<PlatformDailyRollupMetrics | null> {
  const latest = await prisma.platformDailyRollup.findFirst({
    orderBy: { date: "desc" },
    select: { metrics: true },
  });
  return latest ? (latest.metrics as unknown as PlatformDailyRollupMetrics) : null;
}

/**
 * "Response rate 72h" (§4.1 Band 1) — % of applications with an employer
 * status change or message within 72h. Computed LIVE here, not read from
 * `platform_daily_rollups`, because no such field exists in
 * `PlatformDailyRollupMetrics` today — this is the one Band 1 number that is
 * a genuine exception to "read the rollup table, never the live tables"
 * (see this module's top doc comment). Adding it to the nightly rollup (so
 * it also gets a historical trend) is the natural follow-up, flagged here
 * rather than done in this pass, to avoid changing the cron/backfill
 * contract as a side effect of a Home-dashboard task.
 *
 * Bounded to the same `RESPONSE_METRICS_WINDOW_DAYS` (90 days) trailing
 * window lib/employer/response-metrics.ts's own company-level metric uses —
 * reusing that precedent rather than inventing a second window, and keeping
 * the query indexed/bounded (`Application.appliedAt`) rather than an
 * unbounded scan of every application ever submitted.
 */
async function computePlatformResponseRate72h(): Promise<SampledMetric> {
  const windowStart = new Date(Date.now() - RESPONSE_METRICS_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const samples: ResponseMetricsSample[] = await prisma.application.findMany({
    where: { appliedAt: { gte: windowStart } },
    select: { appliedAt: true, firstEmployerResponseAt: true },
  });
  const result = computeResponseRate72h(samples);
  return toSampledMetric(result.responseRate, result.sampleSize);
}

export type MarketplacePulse = {
  fillRate30d: SampledMetric;
  responseRate72h: SampledMetric;
  medianTimeToFirstApplicantHours: SampledMetric;
  activeSupplyDemand: ActiveSupplyDemand;
  /** Raw dated series, most-recent last — see `getMarketplacePulseTrend`'s doc comment. */
  trend: MarketplacePulseTrendPoint[];
};

// ============================================================================
// Band 2 — Money. No revenue/subscription-billing schema exists at all
// (docs/ADMIN-CONSOLE-PLAN.md §6.3a, §4.4, §11 Phase 6 — externally blocked
// on business registration). This is a discriminated union with exactly one
// member today so the type system makes it IMPOSSIBLE for a UI to
// accidentally render a fabricated MRR/ARPU/margin number here — the same
// discipline lib/admin/system-health.ts's `SystemHealthMetric<T>` uses for
// its four uninstrumented metrics. When Phase 6 ships a real payment
// provider + transactions ledger, this union grows a second member (e.g.
// `{ status: "ok"; mrr, arpu, ... }`); it does not get a fake one now.
// ============================================================================

export type MoneyBand = { status: "blocked"; reason: string };

const MONEY_BLOCKED_REASON =
  "No payment provider is onboarded (PayMongo/Paddle integration is Phase 6, docs/ADMIN-CONSOLE-PLAN.md §6.3a) and no revenue/subscription-billing schema exists yet (§4.4, §11 Phase 6 — externally blocked on business registration). MRR, paying companies, ARPU, logo churn, run-rate cost, and gross margin cannot be honestly computed from any table this app has.";

/** Pure — always the one honest answer this app has for Band 2 today. */
export function getMoneyBand(): MoneyBand {
  return { status: "blocked", reason: MONEY_BLOCKED_REASON };
}

// ============================================================================
// Band 3 — Work. `queueHealth` and `getDecisionStats`/`getRecentOverturns`
// are reused verbatim from lib/admin/queues.ts — nothing here recomputes
// queue depth, SLA breaches, or the overturn self-join.
// ============================================================================

/**
 * Mirrors `SystemHealthMetric<T>`'s discriminated-union shape for the exact
 * same reason: a sub-field can be withheld from an admin who lacks the
 * permission it requires, but it must be withheld as an explicit, typed
 * "restricted" state — never silently omitted (which a UI could misread as
 * "empty") and never replaced with a real value the caller isn't entitled
 * to see.
 */
export type PermissionGated<T> = { status: "ok"; value: T } | { status: "restricted"; reason: string };

const DECISION_BREAKDOWN_RESTRICTED_REASON =
  'Requires the "queue.decide" permission. A per-admin approvals/rejections/overturns breakdown identifies individual reviewers\' decision patterns — the same reviewer-performance-leak reasoning /admin/queues already gates on "queue.decide" for `getDecisionStats`, applied consistently here.';

export type Work = {
  /** Depth, oldest-item age, SLA breach count per queue — visible to any admin, same as the old placeholder's pendingJobs/pendingCompanies tiles (no reviewer-identifying detail here). */
  queueHealth: QueueHealth[];
  /** "Today: approvals, rejections, verifications, by admin." Gated — see `DECISION_BREAKDOWN_RESTRICTED_REASON`. */
  decisionStats: PermissionGated<DecisionStats>;
  /** "Recent overturns — the quality signal, not the volume signal." Same gate as `decisionStats`, for the identical reason (it names the original AND overturning admin). */
  recentOverturns: PermissionGated<RecentOverturn[]>;
};

/** [start, end) UTC day boundary — "Today" per §4.1 Band 3, not `getDecisionStats`'s normal 7-day default window (that default is for `/admin/queues`; the Home page explicitly asks for today only). */
function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

// ============================================================================
// Full aggregate.
// ============================================================================

export type AdminHomeDashboard = {
  generatedAt: Date;
  marketplacePulse: MarketplacePulse;
  money: MoneyBand;
  work: Work;
};

/**
 * `/admin` Home — one aggregate for the three-band dashboard.
 *
 * PERMISSION GATE — deliberately the bare "signed in as `Role.ADMIN`" check
 * (the same one `requireAdminPageContext` already performs before this is
 * called), NOT an additional `AdminPermission`, for Band 1 and Band 2 and
 * for `work.queueHealth`: every number in those is either (a) an aggregate
 * platform statistic with no PII and no reviewer-identifying detail
 * (fill rate, response rate, supply/demand, the 90-day trend), (b) the
 * always-honest "blocked" marker (Money), or (c) a per-QUEUE (not
 * per-ADMIN) depth/age/breach count — the same category of number the
 * pre-existing placeholder dashboard already showed to any admin with zero
 * extra permission (`pendingJobs`/`pendingCompanies`). There is no
 * "console home" permission in `ADMIN_PERMISSIONS`
 * (lib/admin/permissions.ts) to gate on, and inventing one would be a wider
 * RBAC change than this task asked for.
 *
 * The ONE exception is `work.decisionStats`/`work.recentOverturns` — a
 * per-admin approvals/rejections/overturns breakdown, which identifies
 * individual reviewers' decision patterns. `/admin/queues` already gates
 * the identical data (`getDecisionStats`) behind `queue.decide` for exactly
 * that reason (see app/admin/queues/page.tsx's own comment on the call).
 * This function enforces the same gate here, in `/lib` (the "real gate" per
 * lib/admin/permissions.ts's own module doc comment — a route/page guard
 * must not be the only thing standing between a SUPPORT-level admin and
 * another admin's reviewer-performance data), rather than throwing for the
 * whole page: a SUPPORT-level admin still gets Bands 1 and 2 plus queue
 * depth counts, with the decision/overturn breakdown replaced by an
 * explicit `{ status: "restricted", reason }` marker instead of silently
 * disappearing or 403ing the entire Home page.
 */
export async function getAdminHomeDashboard(adminUserId: string): Promise<AdminHomeDashboard> {
  const access = await loadResolvedAdminAccess(adminUserId);
  const canSeeDecisionBreakdown = hasPermission(access, "queue.decide");

  const [latestRollup, trend, activeSupplyDemand, responseRate72h, queueHealth, decisionBreakdown] =
    await Promise.all([
      getLatestRollupMetrics(),
      getMarketplacePulseTrend(),
      computeActiveSupplyDemand(),
      computePlatformResponseRate72h(),
      getQueueHealth(),
      canSeeDecisionBreakdown
        ? Promise.all([getDecisionStats({ since: startOfUtcDay(new Date()) }), getRecentOverturns()])
        : Promise.resolve(null),
    ]);

  const decisionStats: PermissionGated<DecisionStats> = decisionBreakdown
    ? { status: "ok", value: decisionBreakdown[0] }
    : { status: "restricted", reason: DECISION_BREAKDOWN_RESTRICTED_REASON };
  const recentOverturns: PermissionGated<RecentOverturn[]> = decisionBreakdown
    ? { status: "ok", value: decisionBreakdown[1] }
    : { status: "restricted", reason: DECISION_BREAKDOWN_RESTRICTED_REASON };

  return {
    generatedAt: new Date(),
    marketplacePulse: {
      fillRate30d: latestRollup ? toSampledMetric(latestRollup.fillRate.rate, latestRollup.fillRate.sampleSize) : null,
      responseRate72h,
      medianTimeToFirstApplicantHours: latestRollup
        ? toSampledMetric(
            latestRollup.medianTimeToFirstApplicantHours.hours,
            latestRollup.medianTimeToFirstApplicantHours.sampleSize
          )
        : null,
      activeSupplyDemand,
      trend,
    },
    money: getMoneyBand(),
    work: { queueHealth, decisionStats, recentOverturns },
  };
}
