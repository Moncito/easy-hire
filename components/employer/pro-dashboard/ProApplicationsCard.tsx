import Link from "next/link";
import { ChevronRight, Inbox, Plus } from "lucide-react";
import { AnalyticsCard, Button, TrendBarChart } from "@/components/employer/system";
import type { ApplicationsChart } from "@/lib/employer/dashboard-pipeline";
import { MIN_VIEWS_FOR_RATE } from "@/lib/employer/dashboard-pipeline";
import type { DashboardRange } from "@/lib/employer/dashboard-insights";

/** Every day for a week; weekly for 30 days; every 10th day for 60. */
const LABEL_EVERY: Record<DashboardRange, number> = { 7: 1, 30: 7, 60: 10 };

/**
 * Daily applications (ink) and moves to interview (marigold) on Recharts.
 * Labels arrive pre-formatted from the server, so nothing here formats
 * dates. With nothing in the range, a compact empty state with the next
 * step replaces the chart — no flat, blank plot.
 */
export default function ProApplicationsCard({ chart, range }: { chart: ApplicationsChart; range: DashboardRange }) {
  const empty = chart.days.every((d) => d.applications === 0 && d.interviews === 0);

  return (
    <AnalyticsCard
      id="pro-applications-heading"
      title="Applications"
      description={`Last ${range} days`}
      legend={[
        { label: "Applications", tone: "ink" },
        { label: "Moved to interview", tone: "marigold" },
      ]}
      empty={
        empty
          ? {
              icon: <Inbox />,
              title: "No applications in this range",
              description: "Sharing a listing is the quickest way to get more — or try a longer range.",
              action: (
                <Button href="/employer/jobs" size="sm" icon={<Plus />}>
                  Go to your listings
                </Button>
              ),
            }
          : null
      }
      footer={
        <>
          <span>
            Total in range <b className="num">{chart.total}</b>
          </span>
          <span>
            Busiest day <b>{chart.busiestDay ?? "—"}</b>
          </span>
          <span>
            Views to applications{" "}
            {chart.viewToApplyRate === null ? (
              <b
                className="cursor-help border-b border-dotted border-eh-muted !text-eh-muted"
                title={`Fewer than ${MIN_VIEWS_FOR_RATE} views in this range — not enough to be meaningful`}
              >
                —
              </b>
            ) : (
              <b className="num">{chart.viewToApplyRate}%</b>
            )}
          </span>
          <Link href="/employer/reports" className="ml-auto inline-flex items-center gap-1 transition hover:text-eh-ink">
            Full reports
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </>
      }
    >
      <TrendBarChart
        data={chart.days.map((d) => ({
          label: d.label,
          tooltipLabel: d.tooltipDate,
          applications: d.applications,
          interviews: d.interviews,
        }))}
        labelEvery={LABEL_EVERY[range]}
        ariaLabel={`Applications and moves to interview per day, last ${range} days`}
        series={[
          { key: "applications", name: "Applications", tone: "ink" },
          { key: "interviews", name: "Moved to interview", tone: "marigold" },
        ]}
      />
    </AnalyticsCard>
  );
}
