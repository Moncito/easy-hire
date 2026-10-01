import type { ApplicationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { buildDailySeries } from "@/lib/employer/dashboard-kpis";
import { furthestStageReached } from "@/lib/jobs/stage-history";
import type { DashboardRange } from "@/lib/employer/dashboard-insights";

/**
 * PRO DASHBOARD — APPLICATIONS CHART + PIPELINE FUNNEL
 * ====================================================
 * Same population as the KPI strip: applications on ACTIVE listings. So the
 * chart's "Total in range" equals the Applicants tile's in-range count, and
 * the funnel's Applied equals the Applicants tile.
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000;
/** Below this many views in the range, a views → applications rate is noise. Matches the roles table's threshold. */
export const MIN_VIEWS_FOR_RATE = 10;

export type ChartDay = { label: string; tooltipDate: string; applications: number; interviews: number };

export type ApplicationsChart = {
  days: ChartDay[];
  total: number;
  busiestDay: string | null;
  viewsInRange: number;
  viewToApplyRate: number | null;
};

function formatDay(date: Date, range: DashboardRange): { label: string; tooltipDate: string } {
  const tooltipDate = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return {
    label: range === 7 ? date.toLocaleDateString("en-US", { weekday: "short" }) : tooltipDate,
    tooltipDate,
  };
}

/** Pure. Assembles the chart from daily series built with the KPI strip's own bucketing. */
export function buildApplicationsChart(input: {
  applicationTimes: Date[];
  interviewTimes: Date[];
  viewsInRange: number;
  range: DashboardRange;
  now: Date;
}): ApplicationsChart {
  const { range, now } = input;
  const apps = buildDailySeries(input.applicationTimes, range, now).series;
  const ints = buildDailySeries(input.interviewTimes, range, now).series;
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  const days: ChartDay[] = apps.map((applications, i) => {
    const date = new Date(today.getTime() - (range - 1 - i) * MS_PER_DAY);
    return { ...formatDay(date, range), applications, interviews: ints[i] };
  });

  const total = apps.reduce((a, b) => a + b, 0);
  let busiest: ChartDay | null = null;
  for (const day of days) {
    if (day.applications > 0 && (!busiest || day.applications > busiest.applications)) busiest = day;
  }

  return {
    days,
    total,
    busiestDay: busiest?.tooltipDate ?? null,
    viewsInRange: input.viewsInRange,
    viewToApplyRate:
      input.viewsInRange >= MIN_VIEWS_FOR_RATE ? Math.round((total / input.viewsInRange) * 100) : null,
  };
}

export type PipelineFunnel = {
  applied: number;
  reviewed: number;
  interviewed: number;
  hired: number;
  /** Rejected applications with no recorded stage history (they predate it), so they can only count as reviewed. */
  rejectedWithoutHistory: number;
};

/**
 * Pure. Each stage counts applications that reached it or went further, so
 * the numbers never increase down the funnel:
 *  - Reviewed: anything someone has acted on — no longer APPLIED, or ever
 *    moved past it (covers an application moved back to APPLIED).
 *  - Interviewed / Hired: the furthest stage reached, from current status
 *    plus stage history, so an interviewed-then-rejected candidate still
 *    counts as interviewed.
 */
export function buildPipelineFunnel(
  applications: Array<{ status: ApplicationStatus; history: ApplicationStatus[] }>
): PipelineFunnel {
  const funnel: PipelineFunnel = { applied: 0, reviewed: 0, interviewed: 0, hired: 0, rejectedWithoutHistory: 0 };
  for (const app of applications) {
    const furthest = furthestStageReached(app.status, app.history);
    funnel.applied += 1;
    if (app.status !== "APPLIED" || furthest !== "APPLIED") funnel.reviewed += 1;
    if (furthest === "INTERVIEW" || furthest === "HIRED") funnel.interviewed += 1;
    if (furthest === "HIRED") funnel.hired += 1;
    if (app.status === "REJECTED" && app.history.length === 0) funnel.rejectedWithoutHistory += 1;
  }
  return funnel;
}

/** Pure. Percent of the previous stage that reached this one; null when the previous stage is empty. */
export function stageConversion(from: number, to: number): number | null {
  return from > 0 ? Math.round((to / from) * 100) : null;
}

export async function getDashboardPipeline(
  companyId: string,
  range: DashboardRange,
  now: Date = new Date()
): Promise<{ chart: ApplicationsChart; funnel: PipelineFunnel }> {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const rangeStart = new Date(today.getTime() - (range - 1) * MS_PER_DAY);
  const activeJobFilter = { job: { companyId, status: "ACTIVE" as const } };

  const [applications, interviewMoves, viewsInRange] = await Promise.all([
    prisma.application.findMany({
      where: activeJobFilter,
      select: {
        status: true,
        appliedAt: true,
        activities: {
          where: { type: "STAGE_CHANGE" },
          select: { fromStatus: true, toStatus: true },
        },
      },
    }),
    prisma.applicationActivity.findMany({
      where: {
        type: "STAGE_CHANGE",
        toStatus: "INTERVIEW",
        createdAt: { gte: rangeStart },
        application: activeJobFilter,
      },
      select: { createdAt: true },
    }),
    prisma.jobView.count({
      where: { viewedAt: { gte: rangeStart }, job: { companyId, status: "ACTIVE" } },
    }),
  ]);

  const chart = buildApplicationsChart({
    applicationTimes: applications.filter((a) => a.appliedAt >= rangeStart).map((a) => a.appliedAt),
    interviewTimes: interviewMoves.map((m) => m.createdAt),
    viewsInRange,
    range,
    now,
  });

  const funnel = buildPipelineFunnel(
    applications.map((a) => ({
      status: a.status,
      history: a.activities.flatMap((act) =>
        [act.fromStatus, act.toStatus].filter((s): s is ApplicationStatus => s !== null)
      ),
    }))
  );

  return { chart, funnel };
}
