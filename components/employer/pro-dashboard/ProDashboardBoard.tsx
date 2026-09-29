import Link from "next/link";
import { ArrowRight } from "lucide-react";

import type { EmployerAnalytics } from "@/lib/employer-analytics";
import type { DashboardApplicantItem } from "@/lib/employer/dashboard-panels";
import type { GettingStartedStep } from "@/lib/employer/dashboard-sparse";
import type { DashboardInsight, DashboardRange } from "@/lib/employer/dashboard-insights";
import type { DashboardKpis } from "@/lib/employer/dashboard-kpis";
import type { ProWeeklyPoint } from "@/components/employer/charts/pro/ProMonoWeeklyChart";
import { shouldShowApplicantQueue } from "@/lib/employer/dashboard-panels";

import ProMonoWeeklyChart from "@/components/employer/charts/pro/ProMonoWeeklyChart";
import ProMonoFunnel from "@/components/employer/charts/pro/ProMonoFunnel";
import ProCompanyBand from "@/components/employer/pro-dashboard/ProCompanyBand";
import ProJobsTable from "@/components/employer/pro-dashboard/ProJobsTable";
import ProApplicantList from "@/components/employer/pro-dashboard/ProApplicantList";
import ProInsightCard from "@/components/employer/pro-dashboard/ProInsightCard";
import ProKpiStrip from "@/components/employer/pro-dashboard/ProKpiStrip";
import ProGettingStarted from "@/components/employer/pro-dashboard/ProGettingStarted";
import RecentActivity from "@/components/employer/dashboard/RecentActivity";

type Company = {
  companyName: string;
  logoUrl?: string | null;
  headquarters?: string | null;
  verifiedStatus: string;
};

type Props = {
  company: Company;
  analytics: EmployerAnalytics;
  applicantQueue: DashboardApplicantItem[];
  chartData: ProWeeklyPoint[];
  sparse: boolean;
  showGettingStarted: boolean;
  gettingStartedSteps: GettingStartedStep[];
  insights: DashboardInsight[];
  kpis: DashboardKpis;
  range: DashboardRange;
};

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
  showGettingStarted,
  gettingStartedSteps,
  insights,
  kpis,
  range,
}: Props) {
  const { metrics, funnel } = analytics;
  const showApplicants = shouldShowApplicantQueue(metrics.totalApplicants);
  const weekApps = chartData.reduce((sum, day) => sum + day.applications, 0);
  const weekHint =
    weekApps === 0
      ? "Quiet week — share a listing or browse talent."
      : `${weekApps} application${weekApps === 1 ? "" : "s"} in the last 7 days.`;
  const appsChange = formatChange(metrics.appsTodayChange);
  const interviewChange = formatChange(metrics.interviewsChange);

  return (
    <div className="flex flex-col gap-5 pb-8">
      <ProCompanyBand
        companyName={company.companyName}
        companyLogoUrl={company.logoUrl}
        headquarters={company.headquarters}
        verifiedStatus={company.verifiedStatus}
        range={range}
      />

      {/* One place for "what needs you": replaces the dark pill, the pink
          ACTION REQUIRED banner, and the Easy AI line under the name, which
          all repeated the same waiting-applicant count. */}
      <ProInsightCard insights={insights} />

      {showGettingStarted && <ProGettingStarted steps={gettingStartedSteps} />}

      {/* Replaces the old KPI column beside the chart, including the "Score"
          nobody could explain. */}
      <ProKpiStrip kpis={kpis} range={range} />

      <section aria-labelledby="pro-week-heading">
        <div className="pro-card p-5 sm:p-6">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <h2 id="pro-week-heading" className="text-base font-semibold text-ink">
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
              <h2 id="pro-pipeline-heading" className="text-base font-semibold text-ink">
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
