import type { EmployerAnalytics } from "@/lib/employer-analytics";

const MIN_SAMPLE_FOR_RATES = 5;

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

export function formatReviewRate(funnel: EmployerAnalytics["funnel"], totalApplicants: number) {
  if (totalApplicants < MIN_SAMPLE_FOR_RATES) {
    return { value: "—", hint: "Needs 5+ applicants for rate" };
  }
  const reviewed = totalApplicants - funnel.applied;
  const rate = Math.round((reviewed / totalApplicants) * 100);
  return { value: `${rate}%`, hint: `${reviewed} of ${totalApplicants} reviewed` };
}

export function formatHireRate(funnel: EmployerAnalytics["funnel"], totalApplicants: number) {
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
