import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getEmployerAnalyticsCached, getDashboardApplicantQueueCached } from "@/lib/employer-cache";
import { requireEmployerPageContext } from "@/lib/employer-session";
import {
  areMetricsEmpty,
  getGettingStartedSteps,
  getHiringScoreHint,
  getOnboardingAttentionItems,
  isSparseDashboard,
  shouldShowGettingStarted,
} from "@/lib/employer/dashboard-sparse";
import DashboardHero from "@/components/employer/dashboard/DashboardHero";
import HiringScoreGauge from "@/components/employer/dashboard/HiringScoreGauge";
import ProDashboardBoard from "@/components/employer/pro-dashboard/ProDashboardBoard";
import HiringFunnel from "@/components/employer/dashboard/HiringFunnel";
import ActiveJobCards from "@/components/employer/dashboard/ActiveJobCards";
import AttentionStrip from "@/components/employer/dashboard/AttentionStrip";
import RecentActivity from "@/components/employer/dashboard/RecentActivity";
import DashboardMetricCard from "@/components/employer/dashboard/DashboardMetricCard";
import DashboardPipelineSnapshot from "@/components/employer/dashboard/DashboardPipelineSnapshot";
import DashboardSparseBoard from "@/components/employer/dashboard/DashboardSparseBoard";
import DashboardSurface from "@/components/employer/dashboard/DashboardSurface";
import DashboardApplicantQueue from "@/components/employer/dashboard/DashboardApplicantQueue";
import DashboardJobPerformance from "@/components/employer/dashboard/DashboardJobPerformance";
import WeeklyTrendChart from "@/components/employer/charts/WeeklyTrendChart";
import {
  getJobPerformanceRows,
  shouldShowApplicantQueue,
  shouldShowJobPerformance,
} from "@/lib/employer/dashboard-panels";

function VerificationBanners({
  verifiedStatus,
  rejectionReason,
}: {
  verifiedStatus: string;
  rejectionReason: string | null;
}) {
  if (verifiedStatus === "PENDING") {
    return (
      <div className="mb-4 rounded-2xl border border-navy/15 bg-navy/5 px-5 py-4 ring-1 ring-navy/10">
        <p className="font-semibold text-ink">Company verification in progress</p>
        <p className="mt-1 text-sm leading-relaxed text-ink/60">
          Job posts cannot appear on the public board until verification is approved.
        </p>
        <Link
          href="/employer/company-profile"
          className="mt-3 inline-block text-sm font-semibold text-teal hover:underline"
        >
          Review your company profile →
        </Link>
      </div>
    );
  }

  if (verifiedStatus === "REJECTED") {
    return (
      <div className="mb-4 rounded-2xl border border-ember/20 bg-ember/5 px-5 py-4">
        <p className="font-semibold text-ink">Company verification declined</p>
        <p className="mt-1 text-sm leading-relaxed text-ink/60">
          {rejectionReason ??
            "Update your company profile and upload verification documents, then request re-review."}
        </p>
        <Link
          href="/employer/company-profile"
          className="mt-3 inline-block text-sm font-semibold text-teal hover:underline"
        >
          Fix company profile →
        </Link>
      </div>
    );
  }

  return null;
}

export default async function EmployerDashboardPage() {
  const { company, plan } = await requireEmployerPageContext();
  const isPro = plan === "PRO";
  const [analytics, applicantQueue] = await Promise.all([
    getEmployerAnalyticsCached(company.id),
    getDashboardApplicantQueueCached(company.id),
  ]);
  const { metrics, weeklyTrend, insights } = analytics;

  const sparse = isSparseDashboard(analytics);
  const metricsEmpty = areMetricsEmpty(analytics);
  const gettingStartedSteps = getGettingStartedSteps(analytics);
  const showGettingStarted = sparse && shouldShowGettingStarted(gettingStartedSteps);
  const onboardingItems = getOnboardingAttentionItems(analytics);
  const scoreHint = sparse ? getHiringScoreHint(analytics) : null;

  const weeklyTotal =
    weeklyTrend.applications.reduce((sum, day) => sum + day.count, 0) +
    weeklyTrend.interviews.reduce((sum, day) => sum + day.count, 0);
  const chartIsEmpty = weeklyTotal === 0;

  const dayLabels = weeklyTrend.applications.map((d) => {
    const date = new Date(d.date);
    return date.toLocaleDateString(undefined, { weekday: "short" }).slice(0, 3);
  });

  const chartData = weeklyTrend.applications.map((d, i) => ({
    label: dayLabels[i] ?? "",
    applications: d.count,
    interviews: weeklyTrend.interviews[i]?.count ?? 0,
  }));

  return (
    <>
      <VerificationBanners
        verifiedStatus={company.verifiedStatus}
        rejectionReason={company.verificationRejectionReason}
      />

      {isPro ? (
        <ProDashboardBoard
          company={{
            companyName: company.companyName,
            logoUrl: company.logoUrl,
            description: company.description,
            headquarters: company.headquarters,
            industry: company.industry,
            verifiedStatus: company.verifiedStatus,
          }}
          analytics={analytics}
          applicantQueue={applicantQueue}
          chartData={chartData}
          sparse={sparse}
          scoreHint={scoreHint}
          chartIsEmpty={chartIsEmpty}
          showGettingStarted={showGettingStarted}
          gettingStartedSteps={gettingStartedSteps}
          onboardingItems={onboardingItems}
        />
      ) : sparse && chartIsEmpty ? (
        <DashboardSparseBoard
          companyName={company.companyName}
          analytics={analytics}
          onboardingItems={onboardingItems}
          gettingStartedSteps={gettingStartedSteps}
          showGettingStarted={showGettingStarted}
          scoreHint={scoreHint}
          metricsEmpty={metricsEmpty}
          chartIsEmpty={chartIsEmpty}
          applicantQueue={applicantQueue}
        />
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-3">
            <div className="space-y-4 xl:col-span-2">
              <DashboardHero companyName={company.companyName} analytics={analytics} />
              <AttentionStrip items={analytics.attentionItems} fallbackItems={onboardingItems} />
            </div>
            <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3 xl:grid-cols-1">
              <DashboardSurface>
                <HiringScoreGauge
                  score={analytics.hiringScore}
                  percentile={analytics.scorePercentile}
                  hint={scoreHint}
                />
              </DashboardSurface>
              {metricsEmpty ? (
                <div className="sm:col-span-2 xl:col-span-1">
                  <DashboardPipelineSnapshot
                    appsTodayChange={metrics.appsTodayChange}
                    interviewsChange={metrics.interviewsChange}
                  />
                </div>
              ) : (
                <>
                  <DashboardMetricCard
                    label="Apps today"
                    value={metrics.appsToday}
                    change={metrics.appsTodayChange}
                    changeLabel="vs yesterday"
                    sparkline={metrics.appsTodaySparkline}
                    emptyHint="No applications yet today. Share your job posts to attract candidates."
                  />
                  <DashboardMetricCard
                    label="In interview"
                    value={metrics.interviewsActive}
                    change={metrics.interviewsChange}
                    changeLabel="vs last week"
                    sparkline={metrics.interviewsSparkline}
                    sparklineColor="#1E3A5F"
                    emptyHint="No candidates in interview stage. Review applicants to move promising ones forward."
                  />
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
            <DashboardSurface className="lg:col-span-2">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-bold text-ink">Weekly hiring trend</h2>
                <Link
                  href="/employer/reports"
                  className="flex items-center gap-1 text-xs font-semibold text-teal hover:underline"
                >
                  Full reports
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              <WeeklyTrendChart data={chartData} />
            </DashboardSurface>

            <div className="space-y-3">
              <DashboardSurface>
                <h2 className="mb-4 text-sm font-bold text-ink">Hiring funnel</h2>
                <HiringFunnel funnel={analytics.funnel} />
              </DashboardSurface>

              {(insights.actionRequired || insights.marketInsight) && (
                <DashboardSurface>
                  <h2 className="mb-3 text-sm font-bold text-ink">Hiring insights</h2>
                  <div className="space-y-3">
                    {insights.actionRequired && (
                      <div className="rounded-xl bg-ember/5 px-3 py-2.5 ring-1 ring-ember/10">
                        <p className="text-xs font-bold uppercase tracking-wider text-ember">
                          Action required
                        </p>
                        <p className="mt-1 text-xs leading-relaxed text-ink/70">
                          {insights.actionRequired}
                        </p>
                      </div>
                    )}
                    {insights.marketInsight && (
                      <div className="rounded-xl bg-navy/5 px-3 py-2.5 ring-1 ring-navy/10">
                        <p className="text-xs font-bold uppercase tracking-wider text-navy">
                          This week
                        </p>
                        <p className="mt-1 text-xs leading-relaxed text-ink/70">
                          {insights.marketInsight}
                        </p>
                      </div>
                    )}
                  </div>
                </DashboardSurface>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-lg font-bold tracking-tight text-ink">Active jobs</h2>
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
                    sparse && analytics.activeJobs.length > 0 && analytics.activeJobs.length < 3
                  }
                />
              </div>

              {shouldShowApplicantQueue(analytics.metrics.totalApplicants) && (
                <DashboardApplicantQueue
                  items={applicantQueue}
                  needsReview={analytics.metrics.needsReview}
                />
              )}

              {shouldShowJobPerformance(analytics.activeJobs.length) && (
                <DashboardJobPerformance rows={getJobPerformanceRows(analytics.activeJobs)} />
              )}
            </div>
            <RecentActivity items={analytics.recentActivity} sparse={sparse} />
          </div>
        </div>
      )}
    </>
  );
}
