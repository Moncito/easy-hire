import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { EmployerAnalytics } from "@/lib/employer-analytics";
import DashboardSurface from "@/components/employer/dashboard/DashboardSurface";
import DashboardCommandRail from "@/components/employer/dashboard/DashboardCommandRail";
import DashboardJobPerformance from "@/components/employer/dashboard/DashboardJobPerformance";
import WeeklyTrendChart from "@/components/employer/charts/WeeklyTrendChart";
import ReportsMetricStrip from "@/components/employer/reports/ReportsMetricStrip";
import ReportsAiInsightsPanel from "@/components/employer/reports/ReportsAiInsightsPanel";
import {
  getJobPerformanceRows,
  shouldShowJobPerformance,
} from "@/lib/employer/dashboard-panels";

type Props = {
  analytics: EmployerAnalytics;
  chartData: Array<{ label: string; applications: number; interviews: number }>;
  scoreHint: string | null;
  metricsEmpty: boolean;
  sparse: boolean;
};

export default function ReportsDenseBoard({
  analytics,
  chartData,
  scoreHint,
  metricsEmpty,
  sparse,
}: Props) {
  const showPerformance = shouldShowJobPerformance(analytics.activeJobs.length);
  const performanceRows = getJobPerformanceRows(analytics.activeJobs);

  return (
    <div className="space-y-4">
      <ReportsMetricStrip analytics={analytics} />
      <ReportsAiInsightsPanel />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_340px] 2xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 space-y-4">
          <DashboardSurface>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-navy/60">
                  Activity
                </p>
                <h2 className="font-display text-lg font-bold tracking-tight text-ink">
                  7-day hiring trend
                </h2>
              </div>
              <p className="text-[11px] text-ink/40">Applications vs interview moves</p>
            </div>
            <WeeklyTrendChart data={chartData} />
          </DashboardSurface>

          {showPerformance && <DashboardJobPerformance rows={performanceRows} />}
        </div>

        <DashboardCommandRail
          analytics={analytics}
          scoreHint={scoreHint}
          metricsEmpty={metricsEmpty}
          sparse={sparse}
        />
      </div>
    </div>
  );
}

export function ReportsPageHeader() {
  return (
    <div className="mb-4">
      <Link
        href="/employer/dashboard"
        className="mb-2 inline-flex items-center gap-1 text-xs font-semibold text-teal hover:underline"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to dashboard
      </Link>
      <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Hiring reports</h1>
      <p className="mt-1 text-sm text-ink/50">
        Last 7 days · Real metrics from your workspace — updated on each page load.
      </p>
    </div>
  );
}
