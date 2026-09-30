import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { ApplicationsChart } from "@/lib/employer/dashboard-pipeline";
import { MIN_VIEWS_FOR_RATE } from "@/lib/employer/dashboard-pipeline";
import type { DashboardRange } from "@/lib/employer/dashboard-insights";
import ProApplicationsChart from "@/components/employer/pro-dashboard/ProApplicationsChart";

export default function ProApplicationsCard({ chart, range }: { chart: ApplicationsChart; range: DashboardRange }) {
  return (
    <section
      aria-labelledby="pro-applications-heading"
      className="flex flex-col rounded-card border border-eh-line bg-eh-surface shadow-[0_1px_2px_rgba(16,24,40,0.04)]"
    >
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 px-5 pt-4">
        <h2 id="pro-applications-heading" className="text-card-title text-eh-ink">
          Applications
        </h2>
        <span className="text-ui text-eh-muted">Last {range} days</span>
        <div className="ml-auto flex gap-4 text-small text-eh-muted">
          <span className="inline-flex items-center gap-1.5">
            <i className="h-2 w-2 rounded-[2px] bg-eh-ink" aria-hidden="true" />
            Applications
          </span>
          <span className="inline-flex items-center gap-1.5">
            <i className="h-2 w-2 rounded-[2px] bg-eh-marigold" aria-hidden="true" />
            Moved to interview
          </span>
        </div>
      </div>

      <div className="px-5 pb-5 pt-4">
        <ProApplicationsChart days={chart.days} />
      </div>

      <div className="mt-auto flex flex-wrap items-center gap-x-6 gap-y-1 border-t border-eh-line px-5 py-3 text-ui text-eh-muted">
        <span>
          Total in range <b className="num font-semibold text-eh-ink">{chart.total}</b>
        </span>
        <span>
          Busiest day <b className="font-semibold text-eh-ink">{chart.busiestDay ?? "—"}</b>
        </span>
        <span>
          Views to applications{" "}
          {chart.viewToApplyRate === null ? (
            <b
              className="cursor-help border-b border-dotted border-eh-muted font-semibold text-eh-muted"
              title={`Fewer than ${MIN_VIEWS_FOR_RATE} views in this range — not enough to be meaningful`}
            >
              —
            </b>
          ) : (
            <b className="num font-semibold text-eh-ink">{chart.viewToApplyRate}%</b>
          )}
        </span>
        <Link
          href="/employer/reports"
          className="ml-auto inline-flex items-center gap-1 transition hover:text-eh-ink"
        >
          Full reports
          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
