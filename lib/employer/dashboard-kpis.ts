import { prisma } from "@/lib/prisma";
import { DECISION_TARGET_DAYS, daysBetween, type DashboardRange } from "@/lib/employer/dashboard-insights";

/**
 * PRO DASHBOARD KPI STRIP
 * =======================
 * Five tiles, all counted from real rows. Scope, chosen so numbers agree
 * across the page:
 *  - Active jobs, Applicants, In interview, Hired, and the hire rate count
 *    ACTIVE listings only — the same population as the pipeline funnel, so
 *    the funnel's "Applied" equals the Applicants tile.
 *  - Needs review counts APPLIED applications on every job, the exact query
 *    behind the sidebar's Applicants badge (getEmployerNavCounts), so the
 *    badge, this tile, and the decision queue always show the same number.
 * The date range only drives the Applicants delta and sparkline.
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function dayKey(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/**
 * Pure. Daily counts for the `days` days ending today, oldest first, plus the
 * total for the `days` before that (for the delta). Bucketed by the server's
 * local day, matching the rest of employer analytics.
 */
export function buildDailySeries(
  timestamps: Date[],
  days: number,
  now: Date
): { series: number[]; current: number; previous: number } {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const index = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    const d = new Date(today.getTime() - (days - 1 - i) * MS_PER_DAY);
    index.set(dayKey(d), i);
  }
  const windowStart = new Date(today.getTime() - (days - 1) * MS_PER_DAY);
  const previousStart = new Date(windowStart.getTime() - days * MS_PER_DAY);

  const series = new Array<number>(days).fill(0);
  let previous = 0;
  for (const ts of timestamps) {
    const slot = index.get(dayKey(ts));
    if (slot !== undefined) series[slot] += 1;
    else if (ts >= previousStart && ts < windowStart) previous += 1;
  }
  return { series, current: series.reduce((a, b) => a + b, 0), previous };
}

/**
 * Pure. Where the wait bar's fill and the 14-day target marker sit, as
 * fractions of the bar. The bar spans whichever is longer, the wait or the
 * target, so an overdue wait fills it and the marker shows how far past.
 */
export function waitBarGeometry(oldestDays: number, targetDays = DECISION_TARGET_DAYS) {
  const span = Math.max(oldestDays, targetDays);
  return {
    fill: span === 0 ? 0 : oldestDays / span,
    target: targetDays / span,
    overdue: oldestDays > targetDays,
  };
}

/** Pure. Openings are filled up to each job's target — five hires on a one-person role still fills one opening. */
export function countFilled(jobs: Array<{ targetHireCount: number; hired: number }>): number {
  return jobs.reduce((sum, job) => sum + Math.min(job.hired, job.targetHireCount), 0);
}

export type DashboardKpis = {
  activeJobs: { count: number; openings: number; filled: number };
  applicants: {
    total: number;
    inRange: number;
    previousRange: number;
    series: number[];
  };
  needsReview: {
    count: number;
    oldestDays: number | null;
    targetDays: number;
  };
  interview: { count: number; candidates: number; roles: number };
  hired: { count: number; rate: number | null };
};

export async function getDashboardKpis(
  companyId: string,
  range: DashboardRange,
  now: Date = new Date()
): Promise<DashboardKpis> {
  const activeJobs = await prisma.job.findMany({
    where: { companyId, status: "ACTIVE" },
    select: { id: true, targetHireCount: true },
  });
  const jobIds = activeJobs.map((j) => j.id);
  const seriesStart = new Date(now.getTime() - (2 * range + 1) * MS_PER_DAY);

  const [total, hiredByJob, interviewing, needsReviewCount, oldestApplied, recentApplied] = await Promise.all([
    prisma.application.count({ where: { jobId: { in: jobIds } } }),
    prisma.application.groupBy({
      by: ["jobId"],
      where: { jobId: { in: jobIds }, status: "HIRED" },
      _count: { _all: true },
    }),
    prisma.application.findMany({
      where: { jobId: { in: jobIds }, status: "INTERVIEW" },
      select: { seekerId: true, jobId: true },
    }),
    prisma.application.count({ where: { job: { companyId }, status: "APPLIED" } }),
    prisma.application.findFirst({
      where: { job: { companyId }, status: "APPLIED" },
      orderBy: { appliedAt: "asc" },
      select: { appliedAt: true },
    }),
    prisma.application.findMany({
      where: { jobId: { in: jobIds }, appliedAt: { gte: seriesStart } },
      select: { appliedAt: true },
    }),
  ]);

  const hiredMap = new Map(hiredByJob.map((row) => [row.jobId, row._count._all]));
  const hiredCount = hiredByJob.reduce((sum, row) => sum + row._count._all, 0);
  const { series, current, previous } = buildDailySeries(
    recentApplied.map((a) => a.appliedAt),
    range,
    now
  );

  return {
    activeJobs: {
      count: activeJobs.length,
      openings: activeJobs.reduce((sum, j) => sum + j.targetHireCount, 0),
      filled: countFilled(activeJobs.map((j) => ({ targetHireCount: j.targetHireCount, hired: hiredMap.get(j.id) ?? 0 }))),
    },
    applicants: { total, inRange: current, previousRange: previous, series },
    needsReview: {
      count: needsReviewCount,
      oldestDays: oldestApplied ? daysBetween(oldestApplied.appliedAt, now) : null,
      targetDays: DECISION_TARGET_DAYS,
    },
    interview: {
      count: interviewing.length,
      candidates: new Set(interviewing.map((a) => a.seekerId)).size,
      roles: new Set(interviewing.map((a) => a.jobId)).size,
    },
    hired: {
      count: hiredCount,
      rate: total > 0 ? Math.round((hiredCount / total) * 100) : null,
    },
  };
}
