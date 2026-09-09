import { prisma } from "@/lib/prisma";

/**
 * Platform-wide daily rollup — docs/ADMIN-CONSOLE-PLAN.md §7.4. Every
 * metric here is derived from EXISTING tables (users, jobs, applications,
 * companies, seeker_profiles, admin_audit_logs) rather than from
 * `platform_events`, so the admin dashboard has real numbers from day one,
 * before `recordEvent` instrumentation coverage is complete anywhere close
 * to 100%. Charts must read `platform_daily_rollups`, never the live tables
 * (§10.1) — this file is the only thing that's allowed to read the live
 * tables for these numbers.
 */

const FILL_RATE_WINDOW_DAYS = 30;

function truncateToUtcDate(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

/** [start, end) for the single UTC day containing `date`. */
function dayRange(date: Date): { start: Date; end: Date } {
  const start = truncateToUtcDate(date);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
}

/** [start, end) for the `days`-day window ending on (and including) `date`. */
function trailingWindowRange(date: Date, days: number): { start: Date; end: Date } {
  const end = truncateToUtcDate(date);
  end.setUTCDate(end.getUTCDate() + 1); // exclusive upper bound = day after `date`
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - days);
  return { start, end };
}

function median(sortedAscending: number[]): number | null {
  const n = sortedAscending.length;
  if (n === 0) return null;
  const mid = Math.floor(n / 2);
  return n % 2 === 0 ? (sortedAscending[mid - 1] + sortedAscending[mid]) / 2 : sortedAscending[mid];
}

export type PlatformDailyRollupMetrics = {
  signupsByRole: Record<string, number>;
  jobs: {
    created: number;
    published: number;
    /**
     * APPROXIMATION: `Job` has no `closedAt` column and no status-history
     * table, so this counts jobs whose `status` is CLOSED and whose
     * `updatedAt` falls on this day. `updatedAt` also advances on unrelated
     * edits, so — same caveat already documented on the `statusChanges`
     * query in lib/employer/analytics-rollups.ts — this is an upper bound,
     * not an exact count of same-day close events.
     */
    closed: number;
  };
  applications: {
    submitted: number;
    hired: number;
  };
  companies: {
    created: number;
    /**
     * Exact, not an approximation: every path that sets
     * `Company.verifiedStatus = APPROVED` (lib/admin/companies.ts's
     * `reviewCompany`) also writes an `AdminAuditLog` row with
     * `action: "COMPANY_APPROVE"` in the same transaction, so counting audit
     * rows for that day is precise — unlike `jobs.closed` above, there is no
     * "no closedAt column" problem here.
     */
    verified: number;
  };
  /**
   * Headline liquidity metric (§7.4): of jobs PUBLISHED in the
   * `windowDays`-day window ending on this date, the share that have
   * received at least one application (ever, not just in-window).
   * `rate` is null when `sampleSize` is 0 (nothing published in the window
   * yet) rather than a misleading 0.
   */
  fillRate: {
    rate: number | null;
    sampleSize: number;
    windowDays: number;
  };
  /**
   * Median hours between a job's `publishedAt` and its first application's
   * `appliedAt`, for jobs published in the same `windowDays`-day window that
   * have at least one application. `sampleSize` is the count of jobs that
   * cleared that bar (a subset of `fillRate.sampleSize`).
   */
  medianTimeToFirstApplicantHours: {
    hours: number | null;
    sampleSize: number;
    windowDays: number;
  };
  queueDepths: {
    jobsPendingReview: number;
    companiesPending: number;
    seekerVerificationsPending: number;
  };
  /**
   * Admin review latency (build-plan.md's own metrics table, "Employer churn
   * risk") — median hours between a job's `Job.pendingReviewAt` and its
   * decision, for jobs DECIDED on this day. "Decided" is read from
   * `AdminAuditLog` (`action` in `JOB_APPROVE`/`JOB_REJECT`, `targetType`
   * `JOB`), not from `Job.updatedAt` or `Job.publishedAt` — same "exact, not
   * an approximation" reasoning as `companies.verified` above: both review
   * paths (lib/admin/jobs.ts's `reviewJob`) write the audit row in the same
   * `$transaction` as the decision, so the audit row's `createdAt` IS the
   * decision timestamp, precisely.
   *
   * `hours` is null, and jobs decided without a `pendingReviewAt` are
   * excluded from `sampleSize`, when: (a) nothing was decided that day, or
   * (b) every job decided that day predates this column (migrated
   * 2026-09-10) and so has `pendingReviewAt: null`. This is EXPECTED for
   * historical jobs — per instructions, do not backfill and do not invent a
   * fallback (e.g. falling back to `createdAt` would silently overstate
   * latency for every pre-migration job).
   */
  adminReviewLatencyHours: {
    hours: number | null;
    sampleSize: number;
  };
};

/**
 * Fill rate + median time-to-first-applicant share one source list of jobs
 * published in the trailing window, so this computes both from that single
 * `findMany` plus one `groupBy` — not two independent full passes.
 */
async function computeLiquidityMetrics(
  date: Date
): Promise<{
  fillRate: PlatformDailyRollupMetrics["fillRate"];
  medianTimeToFirstApplicantHours: PlatformDailyRollupMetrics["medianTimeToFirstApplicantHours"];
}> {
  const { start, end } = trailingWindowRange(date, FILL_RATE_WINDOW_DAYS);

  const [totalPublished, publishedWithApplication] = await Promise.all([
    // Uses the standalone Job.publishedAt index — a single indexed aggregate.
    prisma.job.count({ where: { publishedAt: { gte: start, lt: end } } }),
    // `applications: { some: {} }` compiles to an EXISTS against the
    // (jobId-indexed) applications table — no N+1, one query.
    prisma.job.findMany({
      where: { publishedAt: { gte: start, lt: end }, applications: { some: {} } },
      select: { id: true, publishedAt: true },
    }),
  ]);

  const fillRate: PlatformDailyRollupMetrics["fillRate"] = {
    rate: totalPublished > 0 ? publishedWithApplication.length / totalPublished : null,
    sampleSize: totalPublished,
    windowDays: FILL_RATE_WINDOW_DAYS,
  };

  let medianTimeToFirstApplicantHours: PlatformDailyRollupMetrics["medianTimeToFirstApplicantHours"] = {
    hours: null,
    sampleSize: 0,
    windowDays: FILL_RATE_WINDOW_DAYS,
  };

  if (publishedWithApplication.length > 0) {
    const jobIds = publishedWithApplication.map((j) => j.id);
    // Single groupBy, `in`-filtered on the indexed jobId column, one row per
    // job — not a query per job.
    const firstApplicationPerJob = await prisma.application.groupBy({
      by: ["jobId"],
      where: { jobId: { in: jobIds } },
      _min: { appliedAt: true },
    });

    const publishedAtById = new Map(publishedWithApplication.map((j) => [j.id, j.publishedAt as Date]));
    const hours: number[] = [];
    for (const row of firstApplicationPerJob) {
      const publishedAt = publishedAtById.get(row.jobId);
      const firstAppliedAt = row._min.appliedAt;
      if (!publishedAt || !firstAppliedAt) continue;
      const diffHours = (firstAppliedAt.getTime() - publishedAt.getTime()) / (1000 * 60 * 60);
      hours.push(Math.max(0, diffHours));
    }
    hours.sort((a, b) => a - b);

    medianTimeToFirstApplicantHours = {
      hours: median(hours),
      sampleSize: hours.length,
      windowDays: FILL_RATE_WINDOW_DAYS,
    };
  }

  return { fillRate, medianTimeToFirstApplicantHours };
}

/**
 * Admin review latency for jobs DECIDED on `date` — see the doc comment on
 * `PlatformDailyRollupMetrics.adminReviewLatencyHours` for why decisions are
 * read from `AdminAuditLog`, not `Job`. Two queries total: one indexed
 * `findMany` on `admin_audit_logs` for that day's decisions, then one batched
 * `findMany` on `jobs` for every decided job's `pendingReviewAt` — not a
 * query per decision.
 */
async function computeAdminReviewLatencyMetrics(
  date: Date
): Promise<PlatformDailyRollupMetrics["adminReviewLatencyHours"]> {
  const { start, end } = dayRange(date);

  const decisions = await prisma.adminAuditLog.findMany({
    where: {
      action: { in: ["JOB_APPROVE", "JOB_REJECT"] },
      targetType: "JOB",
      createdAt: { gte: start, lt: end },
    },
    select: { targetId: true, createdAt: true },
  });

  if (decisions.length === 0) {
    return { hours: null, sampleSize: 0 };
  }

  // A job can in principle be decided more than once in a day (rejected,
  // resubmitted, decided again) — keep every decision row, not just one per
  // job, since each is its own independent review-latency data point against
  // whatever `pendingReviewAt` was current at decision time. `pendingReviewAt`
  // restamps on every re-submission (see the field's schema comment), so the
  // single `Job.pendingReviewAt` value read below is only exactly correct for
  // the MOST RECENT decision on a given job; an earlier same-day decision on
  // a job that was then resubmitted and decided again the same day would be
  // measured against the wrong (later) stamp. This is a narrow same-day edge
  // case, not a systemic bias, and there is no status-history table to do
  // better with (see the "no invented fallback" note above).
  const jobIds = Array.from(new Set(decisions.map((d) => d.targetId)));
  const jobs = await prisma.job.findMany({
    where: { id: { in: jobIds } },
    select: { id: true, pendingReviewAt: true },
  });
  const pendingReviewAtById = new Map(jobs.map((j) => [j.id, j.pendingReviewAt]));

  const hours: number[] = [];
  for (const decision of decisions) {
    const pendingReviewAt = pendingReviewAtById.get(decision.targetId);
    if (!pendingReviewAt) continue; // pre-migration job — no fallback, see comment above
    const diffHours = (decision.createdAt.getTime() - pendingReviewAt.getTime()) / (1000 * 60 * 60);
    hours.push(Math.max(0, diffHours));
  }
  hours.sort((a, b) => a - b);

  return { hours: median(hours), sampleSize: hours.length };
}

/**
 * Computes (but does not persist) the full metrics payload for one day.
 * Split out from `computePlatformDailyRollup` so callers that only need the
 * numbers (tests, previews) don't have to write a row to do it.
 *
 * PERFORMANCE NOTE (§10): every metric below is a single `count`/`groupBy`
 * aggregate — no per-row loops, no N+1. `signupsByRole` (users.createdAt),
 * `jobs.created` (jobs.createdAt), `companies.created` (companies.createdAt),
 * `applications.submitted` (applications.appliedAt), and
 * `applications.hired` (applications.hiredAt) are each a single aggregate
 * query, now index-backed by the Sprint 10b follow-up migration
 * (`@@index([createdAt])` on `User`/`Company`/`Job`, `@@index([appliedAt])`/
 * `@@index([hiredAt])` on `Application`) — before that migration these were
 * same-day COUNTs on unindexed date columns, i.e. sequential scans.
 * `fillRate`/`medianTimeToFirstApplicantHours`/`adminReviewLatencyHours` and
 * the queue-depth gauges below are index-backed too (`Job.publishedAt`,
 * `Application.jobId`, `Job.status`, `Company.verifiedStatus`,
 * `SeekerProfile.idVerificationStatus`, `AdminAuditLog.(action, createdAt)`).
 */
export async function computePlatformDailyRollupMetrics(date: Date): Promise<PlatformDailyRollupMetrics> {
  const { start, end } = dayRange(date);

  const [
    signupsByRoleRaw,
    jobsCreated,
    jobsPublished,
    jobsClosed,
    applicationsSubmitted,
    applicationsHired,
    companiesCreated,
    companiesVerified,
    jobsPendingReview,
    companiesPending,
    seekerVerificationsPending,
    liquidity,
    adminReviewLatencyHours,
  ] = await Promise.all([
    prisma.user.groupBy({ by: ["role"], where: { createdAt: { gte: start, lt: end } }, _count: { _all: true } }),
    prisma.job.count({ where: { createdAt: { gte: start, lt: end } } }),
    prisma.job.count({ where: { publishedAt: { gte: start, lt: end } } }),
    prisma.job.count({ where: { status: "CLOSED", updatedAt: { gte: start, lt: end } } }),
    prisma.application.count({ where: { appliedAt: { gte: start, lt: end } } }),
    prisma.application.count({ where: { hiredAt: { gte: start, lt: end } } }),
    prisma.company.count({ where: { createdAt: { gte: start, lt: end } } }),
    prisma.adminAuditLog.count({ where: { action: "COMPANY_APPROVE", createdAt: { gte: start, lt: end } } }),
    prisma.job.count({ where: { status: "PENDING_REVIEW" } }),
    prisma.company.count({ where: { verifiedStatus: "PENDING" } }),
    prisma.seekerProfile.count({ where: { idVerificationStatus: "PENDING" } }),
    computeLiquidityMetrics(date),
    computeAdminReviewLatencyMetrics(date),
  ]);

  const signupsByRole = Object.fromEntries(
    signupsByRoleRaw.map((row) => [row.role, row._count._all])
  ) as Record<string, number>;

  return {
    signupsByRole,
    jobs: { created: jobsCreated, published: jobsPublished, closed: jobsClosed },
    applications: { submitted: applicationsSubmitted, hired: applicationsHired },
    companies: { created: companiesCreated, verified: companiesVerified },
    fillRate: liquidity.fillRate,
    medianTimeToFirstApplicantHours: liquidity.medianTimeToFirstApplicantHours,
    queueDepths: { jobsPendingReview, companiesPending, seekerVerificationsPending },
    adminReviewLatencyHours,
  };
}

/**
 * Computes and upserts one `platform_daily_rollups` row for `date`.
 * Idempotent — upserted on the unique `date` column, so re-running for the
 * same day (or backfilling an old one) just overwrites with a freshly
 * recomputed value, never creates a duplicate.
 */
export async function computePlatformDailyRollup(date: Date): Promise<PlatformDailyRollupMetrics> {
  const metrics = await computePlatformDailyRollupMetrics(date);
  const day = truncateToUtcDate(date);

  await prisma.platformDailyRollup.upsert({
    where: { date: day },
    create: { date: day, metrics },
    update: { metrics },
  });

  return metrics;
}

/** Runs `computePlatformDailyRollup` for yesterday (UTC) — the nightly cron entry point. */
export async function runPlatformRollupForYesterday(): Promise<PlatformDailyRollupMetrics> {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return computePlatformDailyRollup(yesterday);
}
