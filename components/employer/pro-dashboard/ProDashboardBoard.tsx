import type { EmployerAnalytics } from "@/lib/employer-analytics";
import type { DashboardApplicantItem } from "@/lib/employer/dashboard-panels";
import type { GettingStartedStep } from "@/lib/employer/dashboard-sparse";
import { shouldShowApplicantQueue } from "@/lib/employer/dashboard-panels";
import { buildDashboardAttention, formatResponseTime } from "@/lib/employer/dashboard-attention";

import ProDashboardHeader from "@/components/employer/pro-dashboard/ProDashboardHeader";
import ProAttentionList from "@/components/employer/pro-dashboard/ProAttentionList";
import ProKpiRow from "@/components/employer/pro-dashboard/ProKpiRow";
import ProPipelineStages from "@/components/employer/pro-dashboard/ProPipelineStages";
import ProJobsTable from "@/components/employer/pro-dashboard/ProJobsTable";
import ProApplicantList from "@/components/employer/pro-dashboard/ProApplicantList";
import ProPlaybookRow from "@/components/employer/pro-dashboard/ProPlaybookRow";
import ProGettingStarted from "@/components/employer/pro-dashboard/ProGettingStarted";

type Props = {
  companyName: string;
  companyVerified: boolean;
  /** Company.medianResponseMinutes — null until the nightly rollup has enough applications. */
  medianResponseMinutes: number | null;
  analytics: EmployerAnalytics;
  applicantQueue: DashboardApplicantItem[];
  sparse: boolean;
  showGettingStarted: boolean;
  gettingStartedSteps: GettingStartedStep[];
};

/**
 * Pro dashboard, ordered by what you'd act on: what needs you, the four
 * numbers that matter, then roles beside their pipeline and newest people.
 * The weekly chart lives on Reports — on a quiet week it was a flat line
 * taking a third of the screen.
 */
export default function ProDashboardBoard({
  companyName,
  companyVerified,
  medianResponseMinutes,
  analytics,
  applicantQueue,
  sparse,
  showGettingStarted,
  gettingStartedSteps,
}: Props) {
  const { metrics, funnel } = analytics;
  const attention = buildDashboardAttention(analytics);
  const responseTime = formatResponseTime(medianResponseMinutes);
  const hasRoles = analytics.activeJobs.length > 0;

  return (
    <div className="flex flex-col gap-6 pb-8">
      <ProDashboardHeader companyName={companyName} verified={companyVerified} />

      {showGettingStarted && <ProGettingStarted steps={gettingStartedSteps} />}
      {!hasRoles && <ProPlaybookRow />}

      <ProAttentionList items={attention} />

      <ProKpiRow
        items={[
          {
            label: "Active jobs",
            value: metrics.activeJobs,
            detail: "Live on the job board",
          },
          {
            label: "New applicants",
            value: analytics.newApplicantsThisWeek,
            detail: analytics.newApplicantsThisWeek === 0 ? "None in the last 7 days" : "Last 7 days",
          },
          {
            label: "In interview",
            value: metrics.interviewsActive,
            detail: "Across all roles",
          },
          {
            label: "First response",
            value: responseTime ?? "—",
            detail: responseTime ? "Median, last 90 days" : "Shows once you've replied to more applicants",
          },
        ]}
      />

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <ProJobsTable
          jobs={analytics.activeJobs}
          companyVerified={analytics.companyVerified}
          showPostAnother={sparse && hasRoles && analytics.activeJobs.length < 4}
        />
        <div className="flex flex-col gap-6">
          <ProPipelineStages funnel={funnel} />
          {/* The old "Recent activity" feed listed the same applications as
              this list, minus the stage — one list of people is enough. */}
          {shouldShowApplicantQueue(metrics.totalApplicants) && (
            <ProApplicantList items={applicantQueue} needsReview={metrics.needsReview} />
          )}
        </div>
      </div>
    </div>
  );
}
