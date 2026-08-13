import Link from "next/link";
import type { EmployerAnalytics } from "@/lib/employer-analytics";
import DashboardSurface from "@/components/employer/dashboard/DashboardSurface";
import HiringFunnel from "@/components/employer/dashboard/HiringFunnel";
import RecentActivity from "@/components/employer/dashboard/RecentActivity";

type Props = {
  analytics: EmployerAnalytics;
  scoreHint: string | null;
  metricsEmpty: boolean;
  sparse: boolean;
};

export default function DashboardCommandRail({
  analytics,
  scoreHint,
  metricsEmpty,
  sparse,
}: Props) {
  const { metrics, insights, funnel } = analytics;

  return (
    <div className="flex flex-col gap-3">
      <DashboardSurface className="overflow-hidden !p-0">
        <div className="employer-ws-command-header border-b border-navy/[0.06] px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-navy/60">
            Command center
          </p>
        </div>
        <div className="grid grid-cols-2 gap-px bg-navy/[0.06]">
          <div className="employer-ws-surface-muted px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-ink/40">Score</p>
            <p className="mt-0.5 font-data text-2xl font-bold text-teal">{analytics.hiringScore}</p>
          </div>
          <div className="employer-ws-surface-muted px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-ink/40">Active jobs</p>
            <p className="mt-0.5 font-data text-2xl font-bold text-ink">{metrics.activeJobs}</p>
          </div>
          <div className="employer-ws-surface-muted px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-ink/40">Applicants</p>
            <p className="mt-0.5 font-data text-2xl font-bold text-ink">{metrics.totalApplicants}</p>
          </div>
          <div className="employer-ws-surface-muted px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-ink/40">In review</p>
            <p className="mt-0.5 font-data text-2xl font-bold text-teal">{metrics.needsReview}</p>
          </div>
        </div>
        {scoreHint && (
          <div className="border-t border-navy/[0.06] px-4 py-2.5">
            <p className="text-[11px] leading-relaxed text-ink/45">{scoreHint}</p>
          </div>
        )}
        {metricsEmpty && !scoreHint && (
          <div className="border-t border-navy/[0.06] px-4 py-2.5">
            <p className="text-[11px] leading-relaxed text-ink/45">
              Pipeline is quiet —{" "}
              <Link href="/employer/talent" className="font-semibold text-teal hover:underline">
                browse talent
              </Link>{" "}
              or share your listings to spark activity.
            </p>
          </div>
        )}
      </DashboardSurface>

      <DashboardSurface>
        <h2 className="mb-3 text-sm font-bold text-ink">Hiring funnel</h2>
        <HiringFunnel funnel={funnel} />
      </DashboardSurface>

      {(insights.actionRequired || insights.marketInsight) && (
        <DashboardSurface>
          <h2 className="mb-3 text-sm font-bold text-ink">Hiring insights</h2>
          <div className="space-y-2.5">
            {insights.actionRequired && (
              <div className="rounded-xl bg-ember/5 px-3 py-2.5 ring-1 ring-ember/10">
                <p className="text-[10px] font-bold uppercase tracking-wider text-ember">
                  Action required
                </p>
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
        </DashboardSurface>
      )}

      <RecentActivity items={analytics.recentActivity} sparse={sparse} embedded />
    </div>
  );
}
