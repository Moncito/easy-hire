import type { EmployerAnalytics } from "@/lib/employer-analytics";
import DashboardSurface from "@/components/employer/dashboard/DashboardSurface";
import DashboardMetricCard from "@/components/employer/dashboard/DashboardMetricCard";
import { formatHireRate, formatReviewRate } from "@/lib/employer/reports-helpers";

type Props = {
  analytics: EmployerAnalytics;
};

export default function ReportsMetricStrip({ analytics }: Props) {
  const { metrics, funnel } = analytics;
  const reviewRate = formatReviewRate(funnel, metrics.totalApplicants);
  const hireRate = formatHireRate(funnel, metrics.totalApplicants);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardMetricCard
          label="Apps today"
          value={metrics.appsToday}
          change={metrics.appsTodayChange}
          changeLabel="vs yesterday"
          sparkline={metrics.appsTodaySparkline}
          emptyHint="No applications yet today."
        />
        <DashboardMetricCard
          label="In interview"
          value={metrics.interviewsActive}
          change={metrics.interviewsChange}
          changeLabel="vs last week"
          sparkline={metrics.interviewsSparkline}
          sparklineColor="#1E3A5F"
          emptyHint="No candidates in interview stage."
        />
        <DashboardMetricCard
          label="Needs review"
          value={metrics.needsReview}
          change={null}
          changeLabel=""
          sparkline={metrics.appsTodaySparkline}
          emptyHint="All caught up — no new applications waiting."
        />
        <DashboardMetricCard
          label="Active jobs"
          value={metrics.activeJobs}
          change={null}
          changeLabel=""
          sparkline={metrics.interviewsSparkline}
          sparklineColor="#1E3A5F"
          emptyHint="Post a job to start collecting applicants."
        />
      </div>

      <DashboardSurface className="!py-3">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-ink/40">
              Total applicants
            </p>
            <p className="mt-1 font-data text-xl font-bold text-ink">{metrics.totalApplicants}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-ink/40">Review rate</p>
            <p className="mt-1 font-data text-xl font-bold text-ink">{reviewRate.value}</p>
            <p className="mt-0.5 text-[10px] text-ink/40">{reviewRate.hint}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-ink/40">Hire rate</p>
            <p className="mt-1 font-data text-xl font-bold text-ink">{hireRate.value}</p>
            <p className="mt-0.5 text-[10px] text-ink/40">{hireRate.hint}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-ink/40">
              Hiring score
            </p>
            <p className="mt-1 font-data text-xl font-bold text-teal">{analytics.hiringScore}</p>
            {analytics.scorePercentile !== null && analytics.scorePercentile >= 90 && (
              <p className="mt-0.5 text-[10px] text-ink/40">Top {100 - analytics.scorePercentile}%</p>
            )}
          </div>
        </div>
      </DashboardSurface>
    </div>
  );
}
