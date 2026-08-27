import Link from "next/link";
import { AlertTriangle, Lightbulb } from "lucide-react";
import type { EmployerAnalytics } from "@/lib/employer-analytics";
import type { ReportsExclusiveMetrics } from "@/lib/employer/reports-helpers";
import { formatDaysToHire, formatReviewRate, formatHireRate } from "@/lib/employer/reports-helpers";
import type { JobPerformanceRow } from "@/lib/employer/dashboard-panels";
import ProMonoWeeklyChart from "@/components/employer/charts/pro/ProMonoWeeklyChart";
import ProMonoFunnel from "@/components/employer/charts/pro/ProMonoFunnel";
import ProMonoMeter from "@/components/employer/charts/pro/ProMonoMeter";

type Props = {
  companyId: string;
  analytics: EmployerAnalytics;
  chartData: Array<{ label: string; applications: number; interviews: number }>;
  exclusive: ReportsExclusiveMetrics;
  performanceRows: JobPerformanceRow[];
};

export default function CollaboratorReportsBoard({ companyId, analytics, chartData, exclusive, performanceRows }: Props) {
  const { funnel, metrics } = analytics;
  const reviewRate = formatReviewRate(funnel, metrics.totalApplicants);
  const hireRate = formatHireRate(funnel, metrics.totalApplicants);
  const daysToHire = formatDaysToHire(exclusive.daysToHire);

  // Cumulative funnel — "reached this stage or beyond". `funnel.reviewed` already
  // means "past Applied"; someone HIRED necessarily passed through interview.
  const reachedReview = metrics.totalApplicants - funnel.applied;
  const reachedInterview = funnel.interview + funnel.hired;
  const stageSteps = [
    { from: "Applied", to: "Reviewed", num: reachedReview, den: metrics.totalApplicants },
    { from: "Reviewed", to: "Interview", num: reachedInterview, den: reachedReview },
    { from: "Interview", to: "Hired", num: funnel.hired, den: reachedInterview },
  ];

  const weekApps = chartData.reduce((sum, day) => sum + day.applications, 0);
  const weekInterviews = chartData.reduce((sum, day) => sum + day.interviews, 0);

  return (
    <>
        <header className="border-b border-ink/10 pb-6">
          <p className="text-[10px] font-bold uppercase tracking-[.15em] text-[#9A5B12]">Collaborative hiring</p>
          <h1 className="mt-1 font-display text-3xl font-black tracking-tight">Reports</h1>
          <p className="mt-2 text-sm text-ink/55">Historical hiring patterns across every role you can access — not a live queue.</p>
          <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink/50">
            <span><span className="font-data font-semibold text-ink">{metrics.totalApplicants}</span> applicants all-time</span>
            <span><span className="font-data font-semibold text-ink">{metrics.needsReview}</span> awaiting review</span>
            <span><span className="font-data font-semibold text-ink">{weekApps}</span> new this week</span>
          </p>
        </header>

        {(analytics.insights.actionRequired || analytics.insights.marketInsight) && (
          <section className="mt-6 space-y-2">
            {analytics.insights.actionRequired && (
              <div className="flex items-start gap-2.5 rounded-xl border border-marigold/30 bg-marigold/[0.08] px-4 py-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#9A5B12]" aria-hidden="true" />
                <p className="text-sm leading-relaxed text-ink/75">{analytics.insights.actionRequired}</p>
              </div>
            )}
            {analytics.insights.marketInsight && (
              <div className="flex items-start gap-2.5 rounded-xl border border-ink/10 bg-white/60 px-4 py-3">
                <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-teal" aria-hidden="true" />
                <p className="text-sm leading-relaxed text-ink/70">{analytics.insights.marketInsight}</p>
              </div>
            )}
          </section>
        )}

        {/* Snapshot — raw counts, where every candidate currently sits */}
        <section className="mt-6">
          <p className="text-xs font-bold uppercase tracking-wider text-ink/40">Snapshot</p>
          <h2 className="mt-1 font-display text-lg font-bold tracking-tight text-ink">Where candidates sit now</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <SnapshotStat label="Total applicants" value={metrics.totalApplicants} />
            <SnapshotStat
              label="Awaiting review"
              value={metrics.needsReview}
              tone={metrics.hasOverdueUnreviewed ? "alert" : "default"}
              sub={
                metrics.hasOverdueUnreviewed && metrics.oldestUnreviewedAgeDays != null
                  ? `oldest ${metrics.oldestUnreviewedAgeDays}d`
                  : undefined
              }
            />
            <SnapshotStat label="In interview" value={funnel.interview} />
            <SnapshotStat label="Hired" value={funnel.hired} />
            <SnapshotStat label="New this week" value={analytics.newApplicantsThisWeek} />
            <SnapshotStat label="Active roles" value={metrics.activeJobs} />
          </div>
        </section>

        <section className="mt-7 grid divide-y divide-ink/10 border-y border-ink/10 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <Metric label="Review rate" value={reviewRate.value} hint={reviewRate.hint} />
          <Metric label="Hire rate" value={hireRate.value} hint={hireRate.hint} />
          <Metric label="Avg. days to hire" value={daysToHire.value} hint={daysToHire.hint} />
        </section>

        <div className="mt-8 grid grid-cols-1 gap-3 xl:grid-cols-3">
          <div className="rounded-2xl border border-ink/10 bg-white/60 p-5 shadow-sm xl:col-span-2">
            <p className="text-xs font-bold uppercase tracking-wider text-ink/40">Activity</p>
            <h2 className="mt-1 font-display text-lg font-bold tracking-tight text-ink">7-day hiring trend</h2>
            <p className="mt-0.5 text-sm text-ink/45">
              {weekApps === 0 && weekInterviews === 0
                ? "Quiet week — the baseline stays visible."
                : "New applications vs interview moves, by day."}
            </p>
            <div className="mt-4"><ProMonoWeeklyChart data={chartData} /></div>
          </div>
          <div className="rounded-2xl border border-ink/10 bg-white/60 p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-ink/40">Pipeline</p>
            <h2 className="mt-1 font-display text-lg font-bold tracking-tight text-ink">Hiring funnel</h2>
            <p className="mt-0.5 text-sm text-ink/45">Candidate count at each stage.</p>
            <div className="mt-4"><ProMonoFunnel funnel={funnel} /></div>
          </div>
        </div>

        <div className="mt-3 rounded-2xl border border-ink/10 bg-white/60 p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-ink/40">Conversion</p>
          <h2 className="mt-1 font-display text-lg font-bold tracking-tight text-ink">Stage-to-stage drop-off</h2>
          <p className="mt-1 text-xs leading-relaxed text-ink/50">
            Of everyone who reached a stage, the share that advanced to the next one.
          </p>
          <div className="mt-4 space-y-4">
            {stageSteps.map((step) => (
              <StageStep key={step.to} from={step.from} to={step.to} num={step.num} den={step.den} />
            ))}
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
    </>
  );
}

function SnapshotStat({
  label,
  value,
  sub,
  tone = "default",
}: {
  label: string;
  value: number;
  sub?: string;
  tone?: "default" | "alert";
}) {
  return (
    <div className="rounded-xl border border-ink/10 bg-white/60 px-3.5 py-3 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-[.1em] text-ink/40">{label}</p>
      <p className={`mt-1 font-data text-2xl font-bold ${tone === "alert" && value > 0 ? "text-ember" : "text-ink"}`}>
        {value}
      </p>
      {sub && <p className="mt-0.5 text-[10px] text-ink/45">{sub}</p>}
    </div>
  );
}

function StageStep({ from, to, num, den }: { from: string; to: string; num: number; den: number }) {
  const pct = den > 0 ? Math.round((num / den) * 100) : null;
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <span className="text-xs font-semibold text-ink/60">
          {from} <span className="text-ink/30">→</span> {to}
        </span>
        <span className="font-data text-sm font-bold text-ink">
          {pct != null ? `${pct}%` : "—"}
          <span className="ml-1.5 text-xs font-normal text-ink/40">{num} of {den}</span>
        </span>
      </div>
      <ProMonoMeter percent={pct ?? 0} label={`${from} to ${to}`} />
    </div>
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
