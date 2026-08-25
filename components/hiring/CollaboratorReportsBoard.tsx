import Link from "next/link";
import type { EmployerAnalytics } from "@/lib/employer-analytics";
import type { ReportsExclusiveMetrics } from "@/lib/employer/reports-helpers";
import { formatDaysToHire, formatReviewRate, formatHireRate } from "@/lib/employer/reports-helpers";
import type { JobPerformanceRow } from "@/lib/employer/dashboard-panels";
import type { CompanyMemberRole } from "@/lib/collaborative-hiring";
import RecruiterShell from "@/components/hiring/RecruiterShell";
import ProMonoWeeklyChart from "@/components/employer/charts/pro/ProMonoWeeklyChart";
import ProMonoFunnel from "@/components/employer/charts/pro/ProMonoFunnel";
import ProMonoMeter from "@/components/employer/charts/pro/ProMonoMeter";
import ProMonoStageStrip from "@/components/employer/charts/pro/ProMonoStageStrip";

type Props = {
  companyId: string;
  role: CompanyMemberRole;
  analytics: EmployerAnalytics;
  chartData: Array<{ label: string; applications: number; interviews: number }>;
  exclusive: ReportsExclusiveMetrics;
  performanceRows: JobPerformanceRow[];
};

export default function CollaboratorReportsBoard({ companyId, role, analytics, chartData, exclusive, performanceRows }: Props) {
  const reviewRate = formatReviewRate(analytics.funnel, analytics.metrics.totalApplicants);
  const hireRate = formatHireRate(analytics.funnel, analytics.metrics.totalApplicants);
  const daysToHire = formatDaysToHire(exclusive.daysToHire);

  return (
    <RecruiterShell companyId={companyId} role={role} active="reports">
        <header className="border-b border-ink/10 pb-6">
          <p className="text-[10px] font-bold uppercase tracking-[.15em] text-[#9A5B12]">Collaborative hiring</p>
          <h1 className="mt-1 font-display text-3xl font-black tracking-tight">Reports</h1>
          <p className="mt-2 text-sm text-ink/55">Historical hiring patterns across every role you can access — not a live queue.</p>
        </header>

        <section className="mt-7 grid divide-y divide-ink/10 border-y border-ink/10 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <Metric label="Review rate" value={reviewRate.value} hint={reviewRate.hint} />
          <Metric label="Hire rate" value={hireRate.value} hint={hireRate.hint} />
          <Metric label="Avg. days to hire" value={daysToHire.value} hint={daysToHire.hint} />
        </section>

        <div className="mt-8 grid grid-cols-1 gap-3 xl:grid-cols-3">
          <div className="rounded-2xl border border-ink/10 bg-white/60 p-5 shadow-sm xl:col-span-2">
            <p className="text-xs font-bold uppercase tracking-wider text-ink/40">Activity</p>
            <h2 className="mt-1 font-display text-lg font-bold tracking-tight text-ink">7-day hiring trend</h2>
            <div className="mt-4"><ProMonoWeeklyChart data={chartData} /></div>
          </div>
          <div className="rounded-2xl border border-ink/10 bg-white/60 p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-ink/40">Pipeline</p>
            <h2 className="mt-1 font-display text-lg font-bold tracking-tight text-ink">Hiring funnel</h2>
            <div className="mt-4"><ProMonoFunnel funnel={analytics.funnel} /></div>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-2">
          <div className="rounded-2xl border border-ink/10 bg-white/60 p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-ink/40">Stage mix</p>
            <div className="mt-4"><ProMonoStageStrip funnel={analytics.funnel} /></div>
          </div>
          <div className="space-y-4 rounded-2xl border border-ink/10 bg-white/60 p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-ink/40">Rates</p>
            <ProMonoMeter percent={Number(reviewRate.value.replace("%", "")) || 0} label="Review rate" />
            <ProMonoMeter percent={Number(hireRate.value.replace("%", "")) || 0} fill="marigold" label="Hire rate" />
          </div>
        </div>

        <section className="mt-8">
          <p className="text-xs font-bold uppercase tracking-wider text-ink/40">Listings</p>
          <h2 className="mt-1 font-display text-lg font-bold tracking-tight text-ink">Job performance</h2>
          {performanceRows.length ? (
            <div className="mt-4 divide-y divide-ink/10 overflow-hidden rounded-2xl border border-ink/10 bg-white/60 shadow-sm">
              {performanceRows.map((row) => (
                <Link key={row.id} href={`/hiring/${companyId}/jobs/${row.id}`} className="flex items-center justify-between gap-4 px-4 py-3 text-sm transition hover:bg-marigold/[0.05]">
                  <span className="min-w-0 flex-1 truncate font-semibold text-ink">{row.title}</span>
                  <span className="text-ink/45">{row.applicants} applicants · {row.views} views</span>
                  <span className="font-data font-semibold text-ink">{row.conversion != null ? `${row.conversion}%` : "—"}</span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-ink/50">Conversion by listing appears once a role is live.</p>
          )}
        </section>
    </RecruiterShell>
  );
}

function Metric({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="py-4 sm:px-5 first:sm:pl-0 last:sm:pr-0">
      <p className="text-[10px] font-bold uppercase tracking-[.13em] text-ink/40">{label}</p>
      <p className="mt-1 font-data text-3xl font-bold text-ink">{value}</p>
      <p className="mt-1 text-xs text-ink/45">{hint}</p>
    </div>
  );
}
