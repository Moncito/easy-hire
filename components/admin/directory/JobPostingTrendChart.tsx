"use client";

import { useMemo } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { TooltipContentProps } from "recharts";
import { CircleDashed, TrendingUp } from "lucide-react";
import { useAdminChartTheme } from "@/components/admin/dashboard/useAdminChartTheme";
import { SPARKLINE_COLORS } from "@/components/admin/dashboard/chartColors";
import type { SerializedJobPostingTrendPoint } from "./types";

/**
 * `/admin/jobs/directory` analytics band — the posting trend half of it.
 * Same three-state discipline as `UserSignupTrendChart.tsx`
 * (empty / too-few-points / real chart), same `SPARKLINE_COLORS` +
 * `useAdminChartTheme` bridge, same `sr-only` table + `role="img"` summary.
 *
 * ONE line ("Created"), not three stacked/overlaid series — `postingTrend`
 * carries created/published/closed, and all three are real, distinct
 * signals worth keeping, but plotting three lines on a sparkline this small
 * (`platform_daily_rollups` is young, so most days are single-digit counts)
 * would mostly produce three nearly-flat, overlapping traces that are harder
 * to tell apart than to read as a single quantity. "Created" is the
 * headline metric — it is the leading indicator of directory growth, and
 * published/closed are both *derived* from some day's created jobs moving
 * through the pipeline — so it carries the line, and published/closed move
 * to the tooltip and the `sr-only` table, exactly the same demotion
 * `UserSignupTrendChart.tsx` gives `byRole`. Same "don't combine things that
 * make a chart worse than one clean line" call, applied to a three-series
 * source instead of a per-role breakdown.
 */

const MIN_TREND_POINTS = 3;

type TrendDatum = { dateLabel: string; created: number; published: number; closed: number };

function formatDateLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function PostingTrendTooltip({ active, payload }: TooltipContentProps) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload as TrendDatum | undefined;
  if (!point) return null;
  return (
    <div className="rounded-lg border border-ink/10 bg-white px-2.5 py-1.5 shadow-sm admin-dark:border-white/15 admin-dark:bg-admin-dark-surface">
      <p className="font-data text-[10px] text-ink/45 admin-dark:text-mist/45">{point.dateLabel}</p>
      <p className="font-data text-xs font-bold text-ink admin-dark:text-mist">
        {point.created} created
      </p>
      <ul className="mt-1 space-y-0.5">
        <li className="font-data text-[10px] text-ink/55 admin-dark:text-mist/55">Published: {point.published}</li>
        <li className="font-data text-[10px] text-ink/55 admin-dark:text-mist/55">Closed: {point.closed}</li>
      </ul>
    </div>
  );
}

export default function JobPostingTrendChart({
  postingTrend,
}: {
  /** `lib/admin/jobs.ts`'s `getJobPostingTrend()` — ascending by date, however many `platform_daily_rollups` rows actually exist. Never padded/interpolated upstream. */
  postingTrend: SerializedJobPostingTrendPoint[];
}) {
  const theme = useAdminChartTheme();
  const colors = SPARKLINE_COLORS[theme];

  const points = useMemo<TrendDatum[]>(
    () =>
      postingTrend.map((p) => ({
        dateLabel: formatDateLabel(p.date),
        created: p.created,
        published: p.published,
        closed: p.closed,
      })),
    [postingTrend]
  );

  const hasEnoughHistory = points.length >= MIN_TREND_POINTS;
  const createdInWindow = points.reduce((sum, p) => sum + p.created, 0);
  const publishedInWindow = points.reduce((sum, p) => sum + p.published, 0);
  const closedInWindow = points.reduce((sum, p) => sum + p.closed, 0);

  if (points.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-ink/15 bg-mist/40 p-4 admin-dark:border-white/15 admin-dark:bg-white/5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-ink/45 admin-dark:text-mist/45">
          Job postings
        </p>
        <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-dashed border-ink/20 bg-ink/5 px-2 py-0.5 text-[11px] font-semibold text-ink/50 admin-dark:border-white/20 admin-dark:bg-white/10 admin-dark:text-mist/55">
          <CircleDashed className="h-3 w-3 shrink-0" aria-hidden="true" />
          Not enough data
        </div>
        <p className="mt-2 text-xs text-ink/50 admin-dark:text-mist/50">
          No daily posting rollups have been recorded yet.
        </p>
      </div>
    );
  }

  const rangeLabel =
    points.length > 1 ? `${points[0].dateLabel} to ${points[points.length - 1].dateLabel}` : points[0].dateLabel;
  const ariaLabel = `Job postings: ${createdInWindow} created, ${publishedInWindow} published, ${closedInWindow} closed across ${
    points.length
  } recorded day${points.length === 1 ? "" : "s"}, ${rangeLabel}.${
    hasEnoughHistory ? " Trend chart of created jobs shown below." : ""
  }`;

  return (
    <div className="rounded-2xl border border-ink/5 border-l-[3px] border-l-navy bg-white p-4 admin-dark:border-white/10 admin-dark:border-l-teal admin-dark:bg-white/5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-ink/45 admin-dark:text-mist/45">
          Job postings — created
        </p>
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-ink/40 admin-dark:text-mist/40">
          <TrendingUp className="h-3 w-3 shrink-0" aria-hidden="true" />
          Last {points.length} recorded day{points.length === 1 ? "" : "s"}
        </span>
      </div>
      <p className="mt-1 font-data text-3xl font-bold text-ink admin-dark:text-mist">{createdInWindow.toLocaleString()}</p>
      <p className="text-xs text-ink/45 admin-dark:text-mist/45">
        jobs created — {publishedInWindow.toLocaleString()} published, {closedInWindow.toLocaleString()} closed in the same
        window
      </p>

      {hasEnoughHistory ? (
        <div className="mt-3">
          <table className="sr-only" aria-label="Job postings — daily history">
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Created</th>
                <th scope="col">Published</th>
                <th scope="col">Closed</th>
              </tr>
            </thead>
            <tbody>
              {points.map((p) => (
                <tr key={p.dateLabel}>
                  <th scope="row">{p.dateLabel}</th>
                  <td>{p.created}</td>
                  <td>{p.published}</td>
                  <td>{p.closed}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div role="img" aria-label={ariaLabel} className="h-32 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={points} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                <XAxis dataKey="dateLabel" hide />
                <YAxis hide domain={[0, "dataMax"]} allowDecimals={false} />
                <Tooltip
                  content={(props: TooltipContentProps) => <PostingTrendTooltip {...props} />}
                  cursor={{ stroke: colors.stroke, strokeOpacity: 0.2 }}
                />
                <Area
                  type="monotone"
                  dataKey="created"
                  stroke={colors.stroke}
                  strokeWidth={2}
                  fill={colors.fill}
                  fillOpacity={colors.fillOpacity}
                  dot={false}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="mt-3 space-y-1">
          <p className="flex items-center gap-1.5 text-[11px] text-ink/40 admin-dark:text-mist/40">
            <CircleDashed className="h-3 w-3 shrink-0" aria-hidden="true" />
            Not enough recorded days yet to chart a trend.
          </p>
          <ul className="space-y-0.5">
            {points.map((p) => (
              <li key={p.dateLabel} className="font-data text-xs text-ink/55 admin-dark:text-mist/55">
                {p.dateLabel}: {p.created} created, {p.published} published, {p.closed} closed
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
