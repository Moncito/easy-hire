import { auth } from "@/Auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getEmployerAnalytics } from "@/lib/employer-analytics";
import DashboardHero from "@/components/employer/dashboard/DashboardHero";
import HiringScoreGauge from "@/components/employer/dashboard/HiringScoreGauge";
import HiringFunnel from "@/components/employer/dashboard/HiringFunnel";
import ActiveJobCards from "@/components/employer/dashboard/ActiveJobCards";
import AttentionStrip from "@/components/employer/dashboard/AttentionStrip";
import RecentActivity from "@/components/employer/dashboard/RecentActivity";
import DashboardMetricCard from "@/components/employer/dashboard/DashboardMetricCard";
import WeeklyTrendChart from "@/components/employer/charts/WeeklyTrendChart";

export default async function EmployerDashboardPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "EMPLOYER") {
    redirect("/login");
  }

  const company = await prisma.company.findUnique({
    where: { userId: session.user.id },
  });

  if (!company) {
    redirect("/employer/company-profile");
  }

  const analytics = await getEmployerAnalytics(company.id);
  const { metrics, weeklyTrend, insights } = analytics;

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
      {company.verifiedStatus === "PENDING" && (
        <div className="mb-6 rounded-2xl border border-navy/15 bg-navy/5 px-5 py-4 ring-1 ring-navy/10">
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
      )}

      {company.verifiedStatus === "REJECTED" && (
        <div className="mb-6 rounded-2xl border border-ember/20 bg-ember/5 px-5 py-4">
          <p className="font-semibold text-ink">Company verification declined</p>
          <p className="mt-1 text-sm leading-relaxed text-ink/60">
            {company.verificationRejectionReason ??
              "Update your company profile and upload verification documents, then request re-review."}
          </p>
          <Link
            href="/employer/company-profile"
            className="mt-3 inline-block text-sm font-semibold text-teal hover:underline"
          >
            Fix company profile →
          </Link>
        </div>
      )}

      <div className="mb-6 grid grid-cols-1 items-start gap-6 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <DashboardHero companyName={company.companyName} analytics={analytics} />
          <AttentionStrip items={analytics.attentionItems} />
        </div>
        <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-3 xl:grid-cols-1">
          <div className="rounded-2xl border border-ink/5 bg-white p-5 shadow-sm">
            <HiringScoreGauge score={analytics.hiringScore} percentile={analytics.scorePercentile} />
          </div>
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
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-ink/5 bg-white p-6 shadow-sm lg:col-span-2">
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
          <div className="min-h-[200px]">
            <WeeklyTrendChart data={chartData} />
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-ink/5 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-bold text-ink">Hiring funnel</h2>
            <HiringFunnel funnel={analytics.funnel} />
          </div>

          {(insights.actionRequired || insights.marketInsight) && (
            <div className="rounded-2xl border border-ink/5 bg-white p-6 shadow-sm">
              <h2 className="mb-3 text-sm font-bold text-ink">Hiring insights</h2>
              <div className="space-y-3">
                {insights.actionRequired && (
                  <div className="rounded-xl bg-ember/5 px-3 py-2.5 ring-1 ring-ember/10">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-ember">Action required</p>
                    <p className="mt-1 text-xs leading-relaxed text-ink/70">{insights.actionRequired}</p>
                  </div>
                )}
                {insights.marketInsight && (
                  <div className="rounded-xl bg-navy/5 px-3 py-2.5 ring-1 ring-navy/10">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-navy">This week</p>
                    <p className="mt-1 text-xs leading-relaxed text-ink/70">{insights.marketInsight}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold tracking-tight text-ink">Active jobs</h2>
            <Link
              href="/employer/jobs"
              className="flex items-center gap-1 text-xs font-semibold text-teal hover:underline"
            >
              View all
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <ActiveJobCards jobs={analytics.activeJobs} companyVerified={analytics.companyVerified} />
        </div>
        <RecentActivity items={analytics.recentActivity} />
      </div>
    </>
  );
}
