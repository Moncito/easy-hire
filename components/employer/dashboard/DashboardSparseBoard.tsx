import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { EmployerAnalytics } from "@/lib/employer-analytics";
import type { GettingStartedStep } from "@/lib/employer/dashboard-sparse";
import DashboardHero from "@/components/employer/dashboard/DashboardHero";
import AttentionStrip from "@/components/employer/dashboard/AttentionStrip";
import GettingStartedChecklist from "@/components/employer/dashboard/GettingStartedChecklist";
import ActiveJobCards from "@/components/employer/dashboard/ActiveJobCards";
import DashboardApplicantQueue from "@/components/employer/dashboard/DashboardApplicantQueue";
import DashboardJobPerformance from "@/components/employer/dashboard/DashboardJobPerformance";
import DashboardPlaybookRow from "@/components/employer/dashboard/DashboardPlaybookRow";
import DashboardCommandRail from "@/components/employer/dashboard/DashboardCommandRail";
import type { DashboardApplicantItem } from "@/lib/employer/dashboard-panels";
import {
  getJobPerformanceRows,
  shouldShowApplicantQueue,
  shouldShowJobPerformance,
} from "@/lib/employer/dashboard-panels";

type Props = {
  companyName: string;
  analytics: EmployerAnalytics;
  onboardingItems: ReturnType<typeof import("@/lib/employer/dashboard-sparse").getOnboardingAttentionItems>;
  gettingStartedSteps: GettingStartedStep[];
  showGettingStarted: boolean;
  scoreHint: string | null;
  metricsEmpty: boolean;
  chartIsEmpty: boolean;
  applicantQueue: DashboardApplicantItem[];
};

export default function DashboardSparseBoard({
  companyName,
  analytics,
  onboardingItems,
  gettingStartedSteps,
  showGettingStarted,
  scoreHint,
  metricsEmpty,
  chartIsEmpty,
  applicantQueue,
}: Props) {
  const showApplicants = shouldShowApplicantQueue(analytics.metrics.totalApplicants);
  const showPerformance = shouldShowJobPerformance(analytics.activeJobs.length);
  const performanceRows = getJobPerformanceRows(analytics.activeJobs);
  return (
    <div className="space-y-4">
      <DashboardHero companyName={companyName} analytics={analytics} compact />

      <AttentionStrip items={analytics.attentionItems} fallbackItems={onboardingItems} />

      {showGettingStarted && <GettingStartedChecklist steps={gettingStartedSteps} />}

      {chartIsEmpty && (
        <div>
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-teal">Hiring playbook</p>
              <h2 className="font-display text-lg font-bold tracking-tight text-ink">
                Jump-start your pipeline
              </h2>
            </div>
          </div>
          <DashboardPlaybookRow />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_340px] 2xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 space-y-4">
          <div>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-navy/60">Live listings</p>
                <h2 className="font-display text-lg font-bold tracking-tight text-ink">Active jobs</h2>
              </div>
              <Link
                href="/employer/jobs"
                className="flex items-center gap-1 text-xs font-semibold text-teal hover:underline"
              >
                View all
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <ActiveJobCards
              jobs={analytics.activeJobs}
              companyVerified={analytics.companyVerified}
              showPostAnother={
                analytics.activeJobs.length > 0 && analytics.activeJobs.length < 4
              }
            />
          </div>

          {showApplicants && (
            <DashboardApplicantQueue
              items={applicantQueue}
              needsReview={analytics.metrics.needsReview}
            />
          )}

          {showPerformance && <DashboardJobPerformance rows={performanceRows} />}
        </div>

        <DashboardCommandRail
          analytics={analytics}
          scoreHint={scoreHint}
          metricsEmpty={metricsEmpty}
          sparse
        />
      </div>
    </div>
  );
}
