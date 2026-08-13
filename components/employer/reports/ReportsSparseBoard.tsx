import type { EmployerAnalytics } from "@/lib/employer-analytics";
import DashboardPlaybookRow from "@/components/employer/dashboard/DashboardPlaybookRow";
import DashboardSurface from "@/components/employer/dashboard/DashboardSurface";
import HiringScoreGauge from "@/components/employer/dashboard/HiringScoreGauge";
import HiringFunnel from "@/components/employer/dashboard/HiringFunnel";
import RecentActivity from "@/components/employer/dashboard/RecentActivity";
import ReportsMetricStrip from "@/components/employer/reports/ReportsMetricStrip";
import { getHiringScoreHint } from "@/lib/employer/dashboard-sparse";

type Props = {
  analytics: EmployerAnalytics;
  scoreHint: string | null;
};

export default function ReportsSparseBoard({ analytics, scoreHint }: Props) {
  const hint = scoreHint ?? getHiringScoreHint(analytics);

  return (
    <div className="space-y-4">
      <ReportsMetricStrip analytics={analytics} />

      <div>
        <div className="mb-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-teal">Hiring playbook</p>
          <h2 className="font-display text-lg font-bold tracking-tight text-ink">
            Build momentum in your pipeline
          </h2>
          <p className="mt-1 text-xs text-ink/45">
            Reports will populate as candidates apply and move through your stages.
          </p>
        </div>
        <DashboardPlaybookRow />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <DashboardSurface>
          <HiringScoreGauge
            score={analytics.hiringScore}
            percentile={analytics.scorePercentile}
            hint={hint}
            compact
          />
        </DashboardSurface>
        <DashboardSurface>
          <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-navy/60">
            Pipeline snapshot
          </p>
          <HiringFunnel funnel={analytics.funnel} />
        </DashboardSurface>
      </div>

      <RecentActivity items={analytics.recentActivity} sparse embedded />
    </div>
  );
}
