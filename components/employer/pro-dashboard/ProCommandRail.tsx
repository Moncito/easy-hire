import Link from "next/link";

import type { EmployerAnalytics } from "@/lib/employer-analytics";

import HiringFunnel from "@/components/employer/dashboard/HiringFunnel";
import RecentActivity from "@/components/employer/dashboard/RecentActivity";

type Props = {
  analytics: EmployerAnalytics;
  scoreHint: string | null;
  metricsEmpty: boolean;
  sparse: boolean;
};

export default function ProCommandRail({
  analytics,
  scoreHint,
  metricsEmpty,
  sparse,
}: Props) {
  const { metrics, insights, funnel } = analytics;
  const needsReviewAccent = metrics.hasOverdueUnreviewed ? "text-ember" : "text-ink";

  const pipelineTip =
    scoreHint ??
    (metricsEmpty ? "Pipeline is quiet — share listings or browse talent to spark activity." : null);

  return (
    <div className="flex flex-col gap-4">
      <div className="pro-card overflow-hidden !p-0">
        <div className="border-b border-ink/[0.06] px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-wider text-ink/45">Command center</p>
        </div>
        <div className="grid grid-cols-2 gap-px bg-ink/[0.06]">
          <div className="bg-[var(--pro-surface)]/80 px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-wider text-ink/40">Score</p>
            <p className="mt-0.5 font-data text-2xl font-bold text-[var(--pro-accent-ink)]">{analytics.hiringScore}</p>
          </div>
          <div className="bg-[var(--pro-surface)]/80 px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-wider text-ink/40">Active jobs</p>
            <p className="mt-0.5 font-data text-2xl font-bold text-ink">{metrics.activeJobs}</p>
          </div>
          <div className="bg-[var(--pro-surface)]/80 px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-wider text-ink/40">Applicants</p>
            <p className="mt-0.5 font-data text-2xl font-bold text-ink">{metrics.totalApplicants}</p>
          </div>
          <div className="bg-[var(--pro-surface)]/80 px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-wider text-ink/40">Needs review</p>
            <p className={`mt-0.5 font-data text-2xl font-bold ${needsReviewAccent}`}>
              {metrics.needsReview}
            </p>
          </div>
        </div>
        {pipelineTip && (
          <div className="border-t border-ink/[0.06] px-4 py-2.5">
            <p className="text-xs leading-relaxed text-ink/45">
              {metricsEmpty && !scoreHint ? (
                <>
                  Pipeline is quiet —{" "}
                  <Link href="/employer/talent" className="font-semibold text-[var(--pro-accent-ink)] hover:underline">
                    browse talent
                  </Link>{" "}
                  or share your listings to spark activity.
                </>
              ) : (
                pipelineTip
              )}
            </p>
          </div>
        )}
      </div>

      <div className="pro-card p-5">
        <h2 className="mb-3 font-display text-base font-bold text-ink">Hiring funnel</h2>
        <HiringFunnel funnel={funnel} />
      </div>

      {insights.actionRequired && (
        <div className="pro-card border-ember/15 bg-ember/[0.04] p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-ember">Action required</p>
          <p className="mt-1.5 text-sm leading-relaxed text-ink/70">{insights.actionRequired}</p>
        </div>
      )}

      <RecentActivity items={analytics.recentActivity} sparse={sparse} embedded variant="pro" />
    </div>
  );
}
