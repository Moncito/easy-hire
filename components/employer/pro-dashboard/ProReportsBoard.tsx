import Link from "next/link";
import { Sparkles } from "lucide-react";
import type { EmployerAnalytics } from "@/lib/employer-analytics";
import type { ReportsExclusiveMetrics } from "@/lib/employer/reports-helpers";
import ProPageHeader from "@/components/employer/pro-dashboard/ProPageHeader";
import ProReportsExclusiveRow from "@/components/employer/pro-dashboard/ProReportsExclusiveRow";
import ProButton from "@/components/employer/pro/ProButton";
import ExportCsvLink from "@/components/employer/ui/ExportCsvLink";
import ProMonoWeeklyChart from "@/components/employer/charts/pro/ProMonoWeeklyChart";
import ProMonoFunnel from "@/components/employer/charts/pro/ProMonoFunnel";
import ReportsAiInsightsPanel from "@/components/employer/reports/ReportsAiInsightsPanel";
import DashboardJobPerformance from "@/components/employer/dashboard/DashboardJobPerformance";
import { getJobPerformanceRows } from "@/lib/employer/dashboard-panels";

type Props = {
  analytics: EmployerAnalytics;
  chartData: Array<{ label: string; applications: number; interviews: number }>;
  exclusive: ReportsExclusiveMetrics;
  sparse: boolean;
};

export default function ProReportsBoard({ analytics, chartData, exclusive, sparse }: Props) {
  const performanceRows = getJobPerformanceRows(analytics.activeJobs);
  const weekApps = chartData.reduce((sum, day) => sum + day.applications, 0);
  const weekInterviews = chartData.reduce((sum, day) => sum + day.interviews, 0);

  return (
    <div className="pb-6">
      <ProPageHeader
        title="Reports"
        description={
          sparse
            ? "Pattern recognition fills in as applications land. CSV export and time-to-hire are ready when you have hires."
            : "Historical hiring patterns — conversion, time-to-hire, and funnel health. Not a live queue."
        }
        stats={
          <>
            <span>
              <span className="font-data font-semibold text-ink">{analytics.metrics.totalApplicants}</span>{" "}
              applicants
            </span>
            <span>
              Score <span className="font-data font-semibold text-ink">{analytics.hiringScore}</span>
            </span>
            <span>
              <span className="font-data font-semibold text-ink">{weekApps}</span> apps this week
            </span>
            {analytics.metrics.hasOverdueUnreviewed && (
              <Link
                href="/employer/applicants?filter=NEEDS_REVIEW"
                className="font-semibold text-ember hover:underline"
              >
                Review is overdue
              </Link>
            )}
          </>
        }
        actions={
          <>
            <ExportCsvLink />
            <ProButton
              href="/employer/easy-ai"
              variant="secondary"
              icon={<Sparkles className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />}
            >
              Easy AI
            </ProButton>
            <ProButton href="/employer/dashboard" variant="ghost">
              Dashboard
            </ProButton>
          </>
        }
      />

      <ProReportsExclusiveRow
        exclusive={exclusive}
        funnel={analytics.funnel}
        totalApplicants={analytics.metrics.totalApplicants}
        weekApplications={chartData.map((day) => day.applications)}
        jobConversions={performanceRows.map((row) => row.conversion ?? 0)}
      />

      <div className="mb-8 grid grid-cols-1 gap-3 xl:grid-cols-3">
        <div className="pro-card overflow-hidden p-0 xl:col-span-2">
          <div className="px-5 pt-5 sm:px-6 sm:pt-6">
            <p className="text-xs font-bold uppercase tracking-wider text-ink/40">Activity</p>
            <h2 className="mt-1 font-display text-lg font-bold tracking-tight text-ink">
              7-day hiring trend
            </h2>
            <p className="mt-0.5 text-sm text-ink/45">
              {weekApps === 0 && weekInterviews === 0
                ? "Quiet week — the chart stays so you can see the baseline."
                : "Applications vs interview moves"}
            </p>
          </div>
          <div className="px-3 pb-4 pt-4 sm:px-4 sm:pb-5">
            <ProMonoWeeklyChart data={chartData} />
          </div>
        </div>

        <div className="pro-card flex flex-col overflow-hidden p-0">
          <div className="px-5 pt-5 sm:px-6 sm:pt-6">
            <p className="text-xs font-bold uppercase tracking-wider text-ink/40">Pipeline</p>
            <h2 className="mt-1 font-display text-lg font-bold tracking-tight text-ink">
              Hiring funnel
            </h2>
            <p className="mt-0.5 text-sm text-ink/45">Stage mix across all jobs</p>
          </div>
          <div className="flex flex-1 flex-col justify-center px-5 py-6 sm:px-6">
            <ProMonoFunnel funnel={analytics.funnel} />
            {analytics.funnel.hired > 0 && (
              <p className="mt-4 text-xs text-ink/45">
                <span className="font-data font-semibold text-ink">{analytics.funnel.hired}</span>{" "}
                hired in this snapshot.
              </p>
            )}
          </div>
        </div>
      </div>

      {performanceRows.length > 0 ? (
        <div className="mb-8">
          <DashboardJobPerformance rows={performanceRows} variant="pro" />
        </div>
      ) : (
        <div className="pro-card mb-8 overflow-hidden p-0">
          <div className="px-5 pt-5 sm:px-6 sm:pt-6">
            <p className="text-xs font-bold uppercase tracking-wider text-ink/40">Listings</p>
            <h2 className="mt-1 font-display text-lg font-bold tracking-tight text-ink">
              Job performance
            </h2>
            <p className="mt-0.5 text-sm text-ink/50">
              Conversion by listing appears once a role is live.
            </p>
          </div>
          <div className="px-5 pb-5 sm:px-6">
            <Link
              href="/employer/jobs/new"
              className="mt-3 inline-block text-sm font-semibold text-[#9A5B12] hover:underline"
            >
              Post a job
            </Link>
          </div>
        </div>
      )}

      <ReportsAiInsightsPanel />
    </div>
  );
}
