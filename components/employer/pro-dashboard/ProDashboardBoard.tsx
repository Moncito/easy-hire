import type { EmployerAnalytics } from "@/lib/employer-analytics";
import type { DashboardDecisions } from "@/lib/employer/dashboard-decisions";
import type { GettingStartedStep } from "@/lib/employer/dashboard-sparse";
import type { DashboardInsight, DashboardRange } from "@/lib/employer/dashboard-insights";
import type { DashboardKpis } from "@/lib/employer/dashboard-kpis";
import type { ApplicationsChart, PipelineFunnel } from "@/lib/employer/dashboard-pipeline";

import ProCompanyBand from "@/components/employer/pro-dashboard/ProCompanyBand";
import ProJobsTable from "@/components/employer/pro-dashboard/ProJobsTable";
import ProDecisionQueue from "@/components/employer/pro-dashboard/ProDecisionQueue";
import ProRecentActivity from "@/components/employer/pro-dashboard/ProRecentActivity";
import ProInsightCard from "@/components/employer/pro-dashboard/ProInsightCard";
import ProKpiStrip from "@/components/employer/pro-dashboard/ProKpiStrip";
import ProApplicationsCard from "@/components/employer/pro-dashboard/ProApplicationsCard";
import ProPipelineFunnel from "@/components/employer/pro-dashboard/ProPipelineFunnel";
import ProGettingStarted from "@/components/employer/pro-dashboard/ProGettingStarted";

type Company = {
  companyName: string;
  logoUrl?: string | null;
  headquarters?: string | null;
  verifiedStatus: string;
};

type Props = {
  company: Company;
  analytics: EmployerAnalytics;
  decisions: DashboardDecisions;
  defaultRejectionMessage: string | null;
  sparse: boolean;
  showGettingStarted: boolean;
  gettingStartedSteps: GettingStartedStep[];
  insights: DashboardInsight[];
  kpis: DashboardKpis;
  chart: ApplicationsChart;
  funnel: PipelineFunnel;
  range: DashboardRange;
};

export default function ProDashboardBoard({
  company,
  analytics,
  decisions,
  defaultRejectionMessage,
  sparse,
  showGettingStarted,
  gettingStartedSteps,
  insights,
  kpis,
  chart,
  funnel,
  range,
}: Props) {
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

      <ProKpiStrip kpis={kpis} range={range} />

      {/* Chart 2/3 + funnel 1/3; stacked below 1180px. */}
      <div className="grid grid-cols-1 gap-3 min-[1181px]:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <ProApplicationsCard chart={chart} range={range} />
        <ProPipelineFunnel funnel={funnel} />
      </div>

      {/* Decision queue 2/3 + recent activity 1/3; stacked below 1180px. The old
          applicant list and activity feed listed the same applications twice. */}
      <div className="grid grid-cols-1 items-start gap-3 min-[1181px]:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <ProDecisionQueue
          queue={decisions.queue}
          queueTotal={decisions.queueTotal}
          inProgress={decisions.inProgress}
          inProgressCandidateCount={decisions.inProgressCandidateCount}
          inProgressApplicationCount={decisions.inProgressApplicationCount}
          defaultRejectionMessage={defaultRejectionMessage}
        />
        <ProRecentActivity events={decisions.activity} />
      </div>

      <ProJobsTable
        jobs={analytics.activeJobs}
        companyVerified={analytics.companyVerified}
        showPostAnother={sparse && analytics.activeJobs.length > 0 && analytics.activeJobs.length < 4}
      />
    </div>
  );
}
