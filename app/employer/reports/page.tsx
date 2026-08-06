import { auth } from "@/Auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getEmployerAnalytics } from "@/lib/employer-analytics";
import HiringScoreGauge from "@/components/employer/dashboard/HiringScoreGauge";
import HiringFunnel from "@/components/employer/dashboard/HiringFunnel";
import WeeklyTrendChart from "@/components/employer/charts/WeeklyTrendChart";
import Sparkline from "@/components/employer/charts/Sparkline";

export default async function EmployerReportsPage() {
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
  const { metrics, weeklyTrend, funnel } = analytics;

  const dayLabels = weeklyTrend.applications.map((d) => {
    const date = new Date(d.date);
    return date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  });

  const chartData = weeklyTrend.applications.map((d, i) => ({
    label: dayLabels[i]?.split(" ")[0] ?? "",
    applications: d.count,
    interviews: weeklyTrend.interviews[i]?.count ?? 0,
  }));

  const totalApps = metrics.totalApplicants;
  const reviewRate = totalApps > 0 ? Math.round(((totalApps - funnel.applied) / totalApps) * 100) : 0;
  const hireRate = totalApps > 0 ? Math.round((funnel.hired / totalApps) * 100) : 0;

  return (
    <>
      <div className="mb-6">
        <Link
          href="/employer/dashboard"
          className="mb-3 inline-flex items-center gap-1 text-xs font-semibold text-teal hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to dashboard
        </Link>
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Hiring reports</h1>
        <p className="mt-1 text-sm text-ink/50">
          Real metrics from your workspace — updated on each page load.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total applicants", value: metrics.totalApplicants },
          { label: "Active jobs", value: metrics.activeJobs },
          { label: "Review rate", value: `${reviewRate}%` },
          { label: "Hire rate", value: `${hireRate}%` },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-ink/5 bg-white p-5 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-wider text-ink/40">{stat.label}</p>
            <p className="mt-2 font-data text-3xl font-bold text-ink">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-ink/5 bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="mb-4 text-sm font-bold text-ink">7-day hiring trend</h2>
          <WeeklyTrendChart data={chartData} />
        </div>
        <div className="rounded-2xl border border-ink/5 bg-white p-6 shadow-sm">
          <HiringScoreGauge score={analytics.hiringScore} percentile={analytics.scorePercentile} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-ink/5 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-bold text-ink">Pipeline funnel</h2>
          <HiringFunnel funnel={funnel} />
        </div>
        <div className="rounded-2xl border border-ink/5 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-bold text-ink">Daily activity</h2>
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-xs font-medium text-ink/60">Applications (7 days)</p>
              <Sparkline values={metrics.appsTodaySparkline} height={48} />
            </div>
            <div>
              <p className="mb-2 text-xs font-medium text-ink/60">Interviews moved (7 days)</p>
              <Sparkline values={metrics.interviewsSparkline} color="#1E3A5F" height={48} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
