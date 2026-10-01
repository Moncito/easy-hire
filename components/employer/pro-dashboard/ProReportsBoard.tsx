import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight, BarChart3, CheckCircle2, Clock, Download, Eye, Filter, Sparkles, Trophy } from "lucide-react";
import type { EmployerAnalytics } from "@/lib/employer-analytics";
import type { ReportsExclusiveMetrics } from "@/lib/employer/reports-helpers";
import { formatDaysToHire } from "@/lib/employer/reports-helpers";
import { getJobPerformanceRows } from "@/lib/employer/dashboard-panels";
import {
  AnalyticsCard,
  Button,
  Card,
  CardHeader,
  EmptyState,
  PageHeader,
  PipelineSummary,
  Table,
  Td,
  Th,
  Tr,
  TrendBarChart,
  cx,
} from "@/components/employer/system";
import { TONE_CHIP, type SectionTone } from "@/components/employer/talent/tones";
import ReportsAiInsightsPanel from "@/components/employer/reports/ReportsAiInsightsPanel";

type Props = {
  analytics: EmployerAnalytics;
  chartData: Array<{ label: string; applications: number; interviews: number }>;
  exclusive: ReportsExclusiveMetrics;
  sparse: boolean;
};

function splitTitle(title: string) {
  const pipe = title.indexOf(" | ");
  return pipe === -1 ? title : title.slice(0, pipe);
}

/** One headline number: tinted icon chip, Space Grotesk value, one line of context, optional visual. */
function StatTile({
  icon,
  tone,
  label,
  value,
  hint,
  children,
}: {
  icon: ReactNode;
  tone: SectionTone;
  label: string;
  value: string;
  hint: ReactNode;
  children?: ReactNode;
}) {
  return (
    <Card as="article" padded={false} className="flex flex-col p-5">
      <div className="flex items-center gap-2.5">
        <span className={cx("grid h-9 w-9 shrink-0 place-items-center rounded-control [&_svg]:h-[18px] [&_svg]:w-[18px]", TONE_CHIP[tone])} aria-hidden="true">
          {icon}
        </span>
        <h2 className="text-ui text-eh-muted">{label}</h2>
      </div>
      <p className="num mt-3 font-heading text-metric text-eh-ink">{value}</p>
      <p className="mt-1 line-clamp-2 text-small text-eh-muted">{hint}</p>
      {children && <div className="mt-auto pt-4">{children}</div>}
    </Card>
  );
}

function Meter({ percent, tone }: { percent: number; tone: "teal" | "marigold" }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-eh-line" aria-hidden="true">
      <div
        className={cx("h-full rounded-full", tone === "teal" ? "bg-eh-teal" : "bg-eh-marigold")}
        style={{ width: `${Math.max(0, Math.min(100, percent))}%` }}
      />
    </div>
  );
}

/**
 * Pro Reports: historical hiring patterns, not a live queue. Four headline
 * numbers on tinted tiles, the 7-day trend (Recharts), the current stage
 * mix, per-listing conversion, and the Easy AI narrative — all on the
 * shared design system, same data as before.
 */
export default function ProReportsBoard({ analytics, chartData, exclusive, sparse }: Props) {
  const performanceRows = getJobPerformanceRows(analytics.activeJobs);
  const weekApps = chartData.reduce((sum, day) => sum + day.applications, 0);
  const weekInterviews = chartData.reduce((sum, day) => sum + day.interviews, 0);
  const days = formatDaysToHire(exclusive.daysToHire);
  const best = exclusive.bestJob;
  const { funnel } = analytics;
  const total = analytics.metrics.totalApplicants;
  const hirePct = total > 0 ? Math.min(100, Math.round((funnel.hired / total) * 100)) : 0;
  const reviewedPct = total > 0 ? Math.min(100, Math.round(((total - funnel.applied) / total) * 100)) : 0;
  const topApplicants = Math.max(0, ...performanceRows.map((row) => row.applicants));
  const quietWeek = weekApps === 0 && weekInterviews === 0;

  return (
    <div className="flex flex-col gap-6 pb-6">
      <PageHeader
        title="Reports"
        description={
          sparse
            ? "Pattern recognition fills in as applications land. CSV export and time-to-hire are ready when you have hires."
            : "Historical hiring patterns — conversion, time-to-hire, and funnel health. Not a live queue."
        }
        meta={
          <>
            <span>
              <b className="num font-semibold text-eh-ink">{total}</b> applicants
            </span>
            <span aria-hidden="true" className="hidden sm:inline">
              ·
            </span>
            <span>
              Hiring score <b className="num font-semibold text-eh-ink">{analytics.hiringScore}</b>
            </span>
            <span aria-hidden="true" className="hidden sm:inline">
              ·
            </span>
            <span>
              <b className="num font-semibold text-eh-ink">{weekApps}</b> this week
            </span>
            {analytics.metrics.hasOverdueUnreviewed && (
              <Link href="/employer/applicants?filter=NEEDS_REVIEW" className="font-medium text-eh-danger hover:underline">
                Review is overdue
              </Link>
            )}
          </>
        }
        actions={
          <>
            <Button href="/api/employer/exports/applicants" native icon={<Download />}>
              Export CSV
            </Button>
            <Button href="/employer/easy-ai" icon={<Sparkles />}>
              Easy AI
            </Button>
          </>
        }
      />

      <section aria-label="Headline numbers" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          icon={<Trophy />}
          tone="marigold"
          label="Best performing job"
          value={best ? (best.conversion == null ? "—" : `${best.conversion}%`) : "—"}
          hint={
            best
              ? `${splitTitle(best.title)} · ${best.applicants} applicant${best.applicants === 1 ? "" : "s"} · ${best.views} views`
              : "Post a job to compare conversion."
          }
        >
          <Link
            href={best ? `/employer/jobs/${best.id}/applicants` : "/employer/jobs/new"}
            className="inline-flex items-center gap-1 rounded-chip text-ui font-medium text-eh-marigold-ink transition-colors duration-150 hover:text-eh-ink"
          >
            {best ? "Open pipeline" : "Post a job"}
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </StatTile>
        <StatTile icon={<Clock />} tone="navy" label="Avg. days to hire" value={days.value} hint={days.hint} />
        <StatTile icon={<Eye />} tone="teal" label="Review rate" value={exclusive.reviewRate.value} hint={exclusive.reviewRate.hint}>
          <Meter percent={reviewedPct} tone="teal" />
        </StatTile>
        <StatTile icon={<CheckCircle2 />} tone="teal" label="Hire rate" value={exclusive.hireRate.value} hint={exclusive.hireRate.hint}>
          <Meter percent={hirePct} tone="marigold" />
        </StatTile>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <AnalyticsCard
          id="reports-trend"
          title="7-day hiring trend"
          description="Applications vs moves to interview"
          legend={[
            { label: "Applications", tone: "ink" },
            { label: "Moved to interview", tone: "marigold" },
          ]}
          empty={
            quietWeek
              ? {
                  icon: <BarChart3 />,
                  title: "Quiet week",
                  description: "No applications or interview moves in the last 7 days.",
                  action: (
                    <Button href="/employer/jobs" size="sm">
                      Go to your listings
                    </Button>
                  ),
                }
              : null
          }
          footer={
            quietWeek ? undefined : (
            <>
              <span>
                Applications <b className="num">{weekApps}</b>
              </span>
              <span>
                Moved to interview <b className="num">{weekInterviews}</b>
              </span>
            </>
            )
          }
        >
          <TrendBarChart
            data={chartData}
            ariaLabel="Applications and moves to interview per day, last 7 days"
            series={[
              { key: "applications", name: "Applications", tone: "ink" },
              { key: "interviews", name: "Moved to interview", tone: "marigold" },
            ]}
          />
        </AnalyticsCard>

        <Card aria-labelledby="reports-funnel">
          <CardHeader id="reports-funnel" title="Stage mix" description="Where applicants are now, all jobs" />
          {total > 0 ? (
            <PipelineSummary
              className="mt-5"
              relativeTo="max"
              note={funnel.hired > 0 ? `${funnel.hired} hired so far.` : undefined}
              stages={[
                { label: "Applied", value: funnel.applied, tone: "ink" },
                { label: "Reviewed", value: funnel.reviewed, tone: "teal-soft" },
                { label: "Interview", value: funnel.interview, tone: "teal" },
                { label: "Hired", value: funnel.hired, tone: "teal-strong" },
              ]}
            />
          ) : (
            <EmptyState compact icon={<Filter />} title="No applicants yet" description="The stage mix appears once people apply." />
          )}
        </Card>
      </div>

      <Card padded={false} aria-labelledby="reports-listings" className="overflow-hidden">
        <CardHeader
          id="reports-listings"
          className="px-5 py-4 sm:px-6"
          title="Job performance"
          description="Views and applicant conversion across active roles"
        />
        {performanceRows.length === 0 ? (
          <div className="border-t border-eh-line">
            <EmptyState
              compact
              icon={<BarChart3 />}
              title="No live roles yet"
              description="Conversion by listing appears once a role is live."
              action={
                <Button href="/employer/jobs/new" variant="primary" size="sm">
                  Post a job
                </Button>
              }
            />
          </div>
        ) : (
          <Table minWidth={560} caption="Job performance">
            <thead>
              <tr>
                <Th>Job</Th>
                <Th align="right">Views</Th>
                <Th align="right">Applicants</Th>
                <Th align="right">Conversion</Th>
              </tr>
            </thead>
            <tbody>
              {performanceRows.map((row) => {
                const share = topApplicants > 0 ? Math.max((row.applicants / topApplicants) * 100, row.applicants > 0 ? 8 : 0) : 0;
                return (
                  <Tr key={row.id}>
                    <Td>
                      <Link
                        href={`/employer/jobs/${row.id}/applicants`}
                        className="block max-w-[320px] rounded-chip"
                        title={row.title}
                      >
                        <span className="line-clamp-1 font-semibold text-eh-ink transition-colors duration-150 hover:text-eh-marigold-ink">
                          {splitTitle(row.title)}
                        </span>
                        <span className="mt-1.5 block h-1.5 max-w-[160px] overflow-hidden rounded-full bg-eh-line" aria-hidden="true">
                          <span className="block h-full rounded-full bg-eh-teal" style={{ width: `${share}%` }} />
                        </span>
                      </Link>
                    </Td>
                    <Td numeric>{row.views}</Td>
                    <Td numeric className={row.applicants === 0 ? "text-eh-muted" : undefined}>
                      {row.applicants}
                    </Td>
                    <Td numeric>
                      {row.conversion === null ? (
                        <span className="text-eh-muted">—</span>
                      ) : (
                        <span className={cx("font-semibold", row.conversion >= 20 ? "text-eh-teal-ink" : "text-eh-ink")}>
                          {row.conversion}%
                        </span>
                      )}
                    </Td>
                  </Tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Card>

      <ReportsAiInsightsPanel />
    </div>
  );
}
