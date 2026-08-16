import { prisma } from "@/lib/prisma";
import type { EmployerAnalytics } from "@/lib/employer-analytics";

const MIN_SAMPLE_FOR_RATES = 5;
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DAYS_TO_HIRE_SAMPLE = 50;

export type RateStat = { value: string; hint: string };

export type BestPerformingJob = {
  id: string;
  title: string;
  conversion: number | null;
  applicants: number;
  views: number;
};

export type DaysToHireStat = {
  days: number | null;
  sample: number;
};

export type ReportsExclusiveMetrics = {
  bestJob: BestPerformingJob | null;
  daysToHire: DaysToHireStat;
  reviewRate: RateStat;
  hireRate: RateStat;
};

export function isSparseReports(analytics: EmployerAnalytics): boolean {
  const weeklyTotal =
    analytics.weeklyTrend.applications.reduce((sum, day) => sum + day.count, 0) +
    analytics.weeklyTrend.interviews.reduce((sum, day) => sum + day.count, 0);

  return analytics.metrics.totalApplicants < MIN_SAMPLE_FOR_RATES || weeklyTotal === 0;
}

export function buildWeeklyChartData(analytics: EmployerAnalytics) {
  const dayLabels = analytics.weeklyTrend.applications.map((d) => {
    const date = new Date(d.date);
    return date.toLocaleDateString(undefined, { weekday: "short" }).slice(0, 3);
  });

  return analytics.weeklyTrend.applications.map((d, i) => ({
    label: dayLabels[i] ?? "",
    applications: d.count,
    interviews: analytics.weeklyTrend.interviews[i]?.count ?? 0,
  }));
}

export function formatReviewRate(funnel: EmployerAnalytics["funnel"], totalApplicants: number): RateStat {
  if (totalApplicants < MIN_SAMPLE_FOR_RATES) {
    return { value: "—", hint: "Needs 5+ applicants for rate" };
  }
  const reviewed = totalApplicants - funnel.applied;
  const rate = Math.round((reviewed / totalApplicants) * 100);
  return { value: `${rate}%`, hint: `${reviewed} of ${totalApplicants} reviewed` };
}

export function formatHireRate(funnel: EmployerAnalytics["funnel"], totalApplicants: number): RateStat {
  if (totalApplicants < MIN_SAMPLE_FOR_RATES) {
    return {
      value: funnel.hired > 0 ? `${funnel.hired} hired` : "—",
      hint: "Needs 5+ applicants for hire rate",
    };
  }
  const rate = Math.round((funnel.hired / totalApplicants) * 100);
  return { value: `${rate}%`, hint: `${funnel.hired} hired total` };
}

export function weeklyTrendIsEmpty(analytics: EmployerAnalytics) {
  return (
    analytics.weeklyTrend.applications.reduce((s, d) => s + d.count, 0) +
      analytics.weeklyTrend.interviews.reduce((s, d) => s + d.count, 0) ===
    0
  );
}

/** Highest applicant/view conversion among jobs that have at least one view. */
export function getBestPerformingJob(
  jobs: EmployerAnalytics["activeJobs"]
): BestPerformingJob | null {
  if (jobs.length === 0) return null;

  const ranked = [...jobs]
    .map((job) => ({
      id: job.id,
      title: job.title,
      conversion:
        job.viewCount > 0 ? Math.round((job.applicantCount / job.viewCount) * 100) : null,
      applicants: job.applicantCount,
      views: job.viewCount,
    }))
    .sort((a, b) => {
      const aScore = a.conversion ?? -1;
      const bScore = b.conversion ?? -1;
      if (bScore !== aScore) return bScore - aScore;
      return b.applicants - a.applicants || b.views - a.views;
    });

  return ranked[0] ?? null;
}

export function formatDaysToHire(stat: DaysToHireStat): RateStat {
  if (stat.days == null || stat.sample === 0) {
    return { value: "—", hint: "Hire someone to start this clock." };
  }
  if (stat.days < 1) {
    return {
      value: "<1 day",
      hint: `Average of ${stat.sample} hire${stat.sample === 1 ? "" : "s"}`,
    };
  }
  const unit = stat.days === 1 ? "day" : "days";
  return {
    value: `${stat.days} ${unit}`,
    hint: `Average of ${stat.sample} hire${stat.sample === 1 ? "" : "s"}`,
  };
}

export async function getAverageDaysToHire(companyId: string): Promise<DaysToHireStat> {
  const hired = await prisma.application.findMany({
    where: { status: "HIRED", job: { companyId } },
    select: { appliedAt: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
    take: DAYS_TO_HIRE_SAMPLE,
  });

  if (hired.length === 0) return { days: null, sample: 0 };

  const totalDays = hired.reduce((sum, row) => {
    const delta = row.updatedAt.getTime() - row.appliedAt.getTime();
    return sum + Math.max(0, delta / MS_PER_DAY);
  }, 0);

  return {
    days: Math.round(totalDays / hired.length),
    sample: hired.length,
  };
}

export async function getReportsExclusiveMetrics(
  companyId: string,
  analytics: EmployerAnalytics
): Promise<ReportsExclusiveMetrics> {
  const daysToHire = await getAverageDaysToHire(companyId);
  return {
    bestJob: getBestPerformingJob(analytics.activeJobs),
    daysToHire,
    reviewRate: formatReviewRate(analytics.funnel, analytics.metrics.totalApplicants),
    hireRate: formatHireRate(analytics.funnel, analytics.metrics.totalApplicants),
  };
}
