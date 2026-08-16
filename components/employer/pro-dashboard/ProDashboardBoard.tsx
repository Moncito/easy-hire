import Link from "next/link";
import { ArrowRight } from "lucide-react";

import type { AttentionItem, EmployerAnalytics } from "@/lib/employer-analytics";
import type { DashboardApplicantItem } from "@/lib/employer/dashboard-panels";
import type { GettingStartedStep } from "@/lib/employer/dashboard-sparse";
import type { ProWeeklyPoint } from "@/components/employer/charts/pro/ProMonoWeeklyChart";
import { shouldShowApplicantQueue } from "@/lib/employer/dashboard-panels";

import ProMonoWeeklyChart from "@/components/employer/charts/pro/ProMonoWeeklyChart";
import ProMonoFunnel from "@/components/employer/charts/pro/ProMonoFunnel";
import ProCompanyBand from "@/components/employer/pro-dashboard/ProCompanyBand";
import ProJobsTable from "@/components/employer/pro-dashboard/ProJobsTable";
import ProApplicantList from "@/components/employer/pro-dashboard/ProApplicantList";
import ProPlaybookRow from "@/components/employer/pro-dashboard/ProPlaybookRow";
import ProAttentionStrip from "@/components/employer/pro-dashboard/ProAttentionStrip";
import ProGettingStarted from "@/components/employer/pro-dashboard/ProGettingStarted";
import RecentActivity from "@/components/employer/dashboard/RecentActivity";

type Company = {
  companyName: string;
  logoUrl?: string | null;
  description?: string | null;
  headquarters?: string | null;
  industry?: string | null;
  verifiedStatus: string;
};

type Props = {
  company: Company;
  analytics: EmployerAnalytics;
  applicantQueue: DashboardApplicantItem[];
  chartData: ProWeeklyPoint[];
  sparse: boolean;
  scoreHint: string | null;
  chartIsEmpty: boolean;
  showGettingStarted: boolean;
  gettingStartedSteps: GettingStartedStep[];
  onboardingItems: AttentionItem[];
};

function Kpi({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: number;
  hint?: string | null;
  accent?: boolean;
}) {
  return (
    <div className="border-b border-ink/[0.06] py-3.5 last:border-0 last:pb-0 first:pt-0">
      <p className="text-xs font-bold uppercase tracking-wider text-ink/40">{label}</p>
      <p className={`mt-1 font-data text-3xl font-bold tabular-nums ${accent ? "text-ember" : "text-ink"}`}>
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs leading-relaxed text-ink/45">{hint}</p> : null}
    </div>
  );
}

function formatChange(change: number | null) {
  if (change === null) return null;
  const sign = change > 0 ? "+" : "";
  return `${sign}${change}%`;
}

export default function ProDashboardBoard({
  company,
  analytics,
  applicantQueue,
  chartData,
  sparse,
  scoreHint,
  chartIsEmpty,
  showGettingStarted,
  gettingStartedSteps,
  onboardingItems,
}: Props) {
  const { metrics, insights, funnel } = analytics;
  const showApplicants = shouldShowApplicantQueue(metrics.totalApplicants);
  const weekApps = chartData.reduce((sum, day) => sum + day.applications, 0);
  const weekHint =
    weekApps === 0
      ? "Quiet week — share a listing or browse talent."
      : `${weekApps} application${weekApps === 1 ? "" : "s"} in the last 7 days.`;
  const appsChange = formatChange(metrics.appsTodayChange);
  const interviewChange = formatChange(metrics.interviewsChange);

  return (
    <div className="flex flex-col gap-8 pb-8">
      <ProCompanyBand
        companyName={company.companyName}
        companyLogoUrl={company.logoUrl}
        description={company.description}
        headquarters={company.headquarters}
        industry={company.industry}
        verifiedStatus={company.verifiedStatus}
        analytics={analytics}
      />

      <ProAttentionStrip items={analytics.attentionItems} fallbackItems={onboardingItems} />

      {showGettingStarted && <ProGettingStarted steps={gettingStartedSteps} />}

      {chartIsEmpty && <ProPlaybookRow />}

      {insights.actionRequired && (
        <div className="rounded-[1.75rem] border border-ember/20 bg-ember/[0.05] px-5 py-4">
          <p className="text-xs font-bold uppercase tracking-wider text-ember">Action required</p>
          <p className="mt-1 text-sm leading-relaxed text-ink/75">{insights.actionRequired}</p>
        </div>
      )}

      <section
        aria-labelledby="pro-week-heading"
        className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_220px]"
      >
        <div className="pro-card p-5 sm:p-6">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <h2 id="pro-week-heading" className="font-display text-xl font-black tracking-tighter text-ink">
                This week
              </h2>
              <p className="mt-0.5 text-sm text-ink/45">{weekHint}</p>
            </div>
            <Link
              href="/employer/reports"
              className="inline-flex items-center gap-1 text-sm font-semibold text-ink/55 hover:text-ink"
            >
              Full reports
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
          <ProMonoWeeklyChart data={chartData} />
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 border-t border-ink/[0.06] pt-4 text-sm">
            <p className="text-ink/55">
              Apps today{" "}
              <span className="font-data font-bold text-ink">{metrics.appsToday}</span>
              {appsChange ? <span className="ml-1.5 text-xs text-ink/40">{appsChange} vs yesterday</span> : null}
            </p>
            <p className="text-ink/55">
              In interview{" "}
              <span className="font-data font-bold text-ink">{metrics.interviewsActive}</span>
              {interviewChange ? (
                <span className="ml-1.5 text-xs text-ink/40">{interviewChange} vs last week</span>
              ) : null}
            </p>
          </div>
        </div>

        <aside className="pro-card flex flex-col justify-center p-5 sm:p-6">
          <Kpi label="Score" value={analytics.hiringScore} hint={scoreHint} />
          <Kpi label="Active jobs" value={metrics.activeJobs} />
          <Kpi label="Applicants" value={metrics.totalApplicants} />
          <Kpi
            label="Needs review"
            value={metrics.needsReview}
            accent={metrics.hasOverdueUnreviewed}
            hint={
              metrics.hasOverdueUnreviewed
                ? `Oldest wait is ${metrics.oldestUnreviewedAgeDays} days`
                : null
            }
          />
          {insights.marketInsight && (
            <p className="mt-3 text-xs leading-relaxed text-ink/45">{insights.marketInsight}</p>
          )}
        </aside>
      </section>

      <ProJobsTable
        jobs={analytics.activeJobs}
        companyVerified={analytics.companyVerified}
        showPostAnother={sparse && analytics.activeJobs.length > 0 && analytics.activeJobs.length < 4}
      />

      {showApplicants && (
        <ProApplicantList items={applicantQueue} needsReview={metrics.needsReview} />
      )}

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-2">
        <section className="pro-card p-5 sm:p-6" aria-labelledby="pro-pipeline-heading">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <h2 id="pro-pipeline-heading" className="font-display text-lg font-black tracking-tighter text-ink">
                Pipeline
              </h2>
              <p className="mt-0.5 text-sm text-ink/45">One bar. Four stages.</p>
            </div>
            <Link
              href="/employer/applicants"
              className="inline-flex items-center gap-1 text-sm font-semibold text-ink/55 hover:text-ink"
            >
              Applicants
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
          <ProMonoFunnel funnel={funnel} />
        </section>

        <RecentActivity items={analytics.recentActivity} sparse={sparse} embedded variant="pro" />
      </div>
    </div>
  );
}
