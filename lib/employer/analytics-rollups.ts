import { prisma } from "@/lib/prisma";
import { redisGet, redisSet } from "@/lib/redis";
import { isEmployerPro } from "@/lib/billing/subscriptions";
import { ApiError } from "@/lib/api-error";

/** Cache the assembled range summary for a short window — Pro reports poll fairly often. */
const ROLLUP_CACHE_TTL_SECONDS = 120;

export type DailyRollupMetrics = {
  applications: number;
  reviewed: number;
  interviews: number;
  hires: number;
  views: number;
  activeJobs: number;
};

function truncateToUtcDate(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function dayRange(date: Date): { start: Date; end: Date } {
  const start = truncateToUtcDate(date);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
}

export async function computeDailyRollup(companyId: string, date: Date): Promise<DailyRollupMetrics> {
  const { start, end } = dayRange(date);

  const [statusGroups, views, activeJobs] = await Promise.all([
    prisma.application.groupBy({
      by: ["status"],
      where: { job: { companyId }, appliedAt: { gte: start, lt: end } },
      _count: { _all: true },
    }),
    prisma.jobView.count({
      where: { job: { companyId }, viewedAt: { gte: start, lt: end } },
    }),
    prisma.job.count({
      where: { companyId, status: "ACTIVE", createdAt: { lt: end } },
    }),
  ]);

  const statusMap = Object.fromEntries(statusGroups.map((g) => [g.status, g._count._all])) as Record<
    string,
    number
  >;

  const applications = statusGroups.reduce((sum, g) => sum + g._count._all, 0);
  const reviewed =
    (statusMap.SHORTLISTED ?? 0) + (statusMap.INTERVIEW ?? 0) + (statusMap.HIRED ?? 0) + (statusMap.REJECTED ?? 0);

  return {
    applications,
    reviewed,
    interviews: statusMap.INTERVIEW ?? 0,
    hires: statusMap.HIRED ?? 0,
    views,
    activeJobs,
  };
}

/** Computes and persists one company's rollup for a given day. Idempotent — safe to re-run. */
export async function upsertDailyRollup(companyId: string, date: Date): Promise<DailyRollupMetrics> {
  const metrics = await computeDailyRollup(companyId, date);
  const day = truncateToUtcDate(date);

  await prisma.analyticsDailyRollup.upsert({
    where: { companyId_date: { companyId, date: day } },
    create: { companyId, date: day, metrics },
    update: { metrics },
  });

  return metrics;
}

/** Runs the previous day's rollup for every company with at least one job — intended for a daily cron. */
export async function runDailyRollupsForAllCompanies(
  date: Date = new Date(Date.now() - 24 * 60 * 60 * 1000)
): Promise<{ companies: number }> {
  const companies = await prisma.company.findMany({
    where: { jobs: { some: {} } },
    select: { id: true },
  });

  for (const company of companies) {
    try {
      await upsertDailyRollup(company.id, date);
    } catch (error) {
      console.error(`[analytics-rollups] failed for company ${company.id}:`, error);
    }
  }

  return { companies: companies.length };
}

export type RollupRangeSummary = {
  days: Array<{ date: string; metrics: DailyRollupMetrics }>;
  totals: DailyRollupMetrics;
};

function emptyMetrics(): DailyRollupMetrics {
  return { applications: 0, reviewed: 0, interviews: 0, hires: 0, views: 0, activeJobs: 0 };
}

function sumMetrics(a: DailyRollupMetrics, b: DailyRollupMetrics): DailyRollupMetrics {
  return {
    applications: a.applications + b.applications,
    reviewed: a.reviewed + b.reviewed,
    interviews: a.interviews + b.interviews,
    hires: a.hires + b.hires,
    views: a.views + b.views,
    activeJobs: b.activeJobs, // point-in-time gauge — use the latest day's value, not a sum
  };
}

/**
 * Reads persisted rollups for [from, to]. Any day missing a rollup (e.g. it
 * hasn't run yet, or it's "today") is computed on the fly so Pro report
 * date ranges are never missing recent data — but only completed days get
 * written back to `AnalyticsDailyRollup`.
 */
export async function getAnalyticsRange(
  companyId: string,
  from: Date,
  to: Date
): Promise<RollupRangeSummary> {
  const cacheKey = `analytics-rollup:${companyId}:${truncateToUtcDate(from).toISOString()}:${truncateToUtcDate(to).toISOString()}`;
  const cached = await redisGet<RollupRangeSummary>(cacheKey);
  if (cached) return cached;

  const start = truncateToUtcDate(from);
  const end = truncateToUtcDate(to);
  const today = truncateToUtcDate(new Date());

  const persisted = await prisma.analyticsDailyRollup.findMany({
    where: { companyId, date: { gte: start, lte: end } },
  });
  const persistedByDate = new Map(persisted.map((r) => [r.date.toISOString(), r.metrics as unknown as DailyRollupMetrics]));

  const days: RollupRangeSummary["days"] = [];
  let totals = emptyMetrics();

  for (let cursor = new Date(start); cursor <= end; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
    const iso = new Date(cursor).toISOString();
    const isToday = cursor.getTime() === today.getTime();

    let metrics = persistedByDate.get(iso);
    if (!metrics) {
      metrics = await computeDailyRollup(companyId, cursor);
      // Persist completed past days so future reads hit the rollup table;
      // never persist "today" since it's still accumulating.
      if (!isToday) {
        await upsertDailyRollup(companyId, cursor).catch(() => null);
      }
    }

    days.push({ date: iso.slice(0, 10), metrics });
    totals = sumMetrics(totals, metrics);
  }

  const summary: RollupRangeSummary = { days, totals };
  await redisSet(cacheKey, summary, ROLLUP_CACHE_TTL_SECONDS);
  return summary;
}

/**
 * Thin Pro gate in front of `getAnalyticsRange` — custom Reports date ranges
 * read from the precomputed rollup table and are an Employer Pro perk, so
 * `GET /api/employer/analytics` calls this instead of the unguarded range
 * reader whenever a caller passes `from`/`to`.
 */
export async function getAnalyticsRangeForPro(
  companyId: string,
  from: Date,
  to: Date
): Promise<RollupRangeSummary> {
  const pro = await isEmployerPro(companyId);
  if (!pro) {
    throw new ApiError(
      "Custom date range reports are an Employer Pro feature. Upgrade to analyze any date range.",
      403
    );
  }
  return getAnalyticsRange(companyId, from, to);
}
