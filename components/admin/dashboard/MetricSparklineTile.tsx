"use client";

import { useMemo } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, YAxis } from "recharts";
import type { TooltipContentProps } from "recharts";
import { CircleDashed } from "lucide-react";
import { useAdminChartTheme } from "./useAdminChartTheme";
import { SPARKLINE_COLORS } from "./chartColors";
import type { SampledMetric } from "@/lib/admin/home-dashboard";

/**
 * One Band-1 tile: a `SampledMetric` (fill rate 30d / response rate 72h /
 * median time-to-first-applicant) rendered as ONE single-axis sparkline —
 * per this codebase's `dataviz` skill, "the #1 chart mistake" is combining
 * two different-unit metrics onto one dual-axis chart, so each metric gets
 * its own instance of this component, never a shared multi-series chart.
 *
 * Three distinct, honest states, never blurred together:
 *  1. `metric === null` — genuinely not enough data (sample size 0). Renders
 *     the same dashed/neutral "not available" visual language as
 *     `components/admin/system/NotInstrumentedPanel.tsx`, carrying its own
 *     `emptyReason` as visible text — never a bare 0 or dash styled like a
 *     real value.
 *  2. `metric` present but fewer than `MIN_TREND_POINTS` usable history
 *     points — the real current value renders normally, but instead of a
 *     chart drawn off 1-2 points (which would look like a real trend line
 *     while being almost meaningless), a plain honest note renders instead.
 *  3. `metric` present with enough history — real value + real sparkline,
 *     thin 2px line, a real hover tooltip, an `sr-only` data table
 *     fallback, and a `role="img"` container with a real summarizing
 *     `aria-label` — matching `ProMonoWeeklyChart.tsx`'s accessibility shape.
 */

export type SparklinePoint = { date: Date; value: number | null };
export type MetricFormatKind = "percent" | "hours";

const MIN_TREND_POINTS = 3;

/**
 * A literal `formatKind` string (not a `(value: number) => string` function
 * prop) on purpose — `MarketplacePulseBand.tsx` is a Server Component and
 * this file is `"use client"`; a plain function cannot cross that boundary
 * (RSC serialization has no function type, so React throws "Functions
 * cannot be passed directly to Client Components" at render time — this
 * shipped once as exactly that runtime error before being caught here).
 * `sampleSizeLabel` was the same class of bug and is fixed the same way:
 * the parent now passes a plain, already-formatted `sampleSizeText` string
 * instead of a function.
 */
function formatMetricValue(kind: MetricFormatKind, value: number): string {
  if (kind === "percent") return `${(value * 100).toFixed(1)}%`;
  return `${value < 10 ? value.toFixed(1) : Math.round(value)}h`;
}

function formatDateLabel(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function SparklineTooltip({
  active,
  payload,
  formatKind,
}: TooltipContentProps & { formatKind: MetricFormatKind }) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload as { dateLabel: string; value: number } | undefined;
  if (!point) return null;
  return (
    <div className="rounded-lg border border-ink/10 bg-white px-2.5 py-1.5 shadow-sm admin-dark:border-white/15 admin-dark:bg-admin-dark-surface">
      <p className="font-data text-[10px] text-ink/45 admin-dark:text-mist/45">{point.dateLabel}</p>
      <p className="font-data text-xs font-bold text-ink admin-dark:text-mist">
        {formatMetricValue(formatKind, point.value)}
      </p>
    </div>
  );
}

export default function MetricSparklineTile({
  label,
  metric,
  trendPoints,
  formatKind,
  sampleSizeText,
  emptyReason,
  trendUnavailableReason,
}: {
  label: string;
  metric: SampledMetric;
  /** Raw dated series — may contain `null` values (a day with zero qualifying samples) and may be empty entirely (e.g. response rate 72h, which has no rollup-backed history at all). */
  trendPoints: SparklinePoint[];
  formatKind: MetricFormatKind;
  /** Already-formatted, e.g. "6 applications with a known 72h outcome" — the parent computes this from `metric.sampleSize` before passing it down, since it's plain data, not a function. */
  sampleSizeText?: string;
  /** Honest, static explanation of what a `null` metric means for THIS metric — never a fabricated number standing in for it. */
  emptyReason: string;
  /** Overrides the generic "not enough history yet" copy when the reason is structural (e.g. not stored in the rollup at all) rather than "too young." */
  trendUnavailableReason?: string;
}) {
  const theme = useAdminChartTheme();
  const colors = SPARKLINE_COLORS[theme];

  const usablePoints = useMemo(
    () =>
      trendPoints
        .filter((p): p is { date: Date; value: number } => p.value !== null)
        .map((p) => ({ dateLabel: formatDateLabel(p.date), value: p.value })),
    [trendPoints]
  );

  const hasEnoughHistory = usablePoints.length >= MIN_TREND_POINTS;

  if (metric === null) {
    return (
      <div className="rounded-2xl border border-dashed border-ink/15 bg-mist/40 p-4 admin-dark:border-white/15 admin-dark:bg-white/5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-ink/45 admin-dark:text-mist/45">
          {label}
        </p>
        <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-dashed border-ink/20 bg-ink/5 px-2 py-0.5 text-[11px] font-semibold text-ink/50 admin-dark:border-white/20 admin-dark:bg-white/10 admin-dark:text-mist/55">
          <CircleDashed className="h-3 w-3 shrink-0" aria-hidden="true" />
          Not enough data
        </div>
        <p className="mt-2 text-xs text-ink/50 admin-dark:text-mist/50">{emptyReason}</p>
      </div>
    );
  }

  const formattedValue = formatMetricValue(formatKind, metric.value);
  const ariaLabel = `${label}: ${formattedValue}${sampleSizeText ? `, based on ${sampleSizeText}` : ""}.${
    hasEnoughHistory
      ? ` Trend over the last ${usablePoints.length} recorded days shown below.`
      : ""
  }`;

  return (
    <div className="rounded-2xl border border-ink/5 bg-white p-4 admin-dark:border-white/10 admin-dark:bg-white/5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-ink/45 admin-dark:text-mist/45">
        {label}
      </p>
      <p className="mt-1 font-data text-2xl font-bold text-ink admin-dark:text-mist">{formattedValue}</p>
      {sampleSizeText && <p className="text-xs text-ink/45 admin-dark:text-mist/45">{sampleSizeText}</p>}

      {hasEnoughHistory ? (
        <div className="mt-3">
          <table className="sr-only" aria-label={`${label} — daily history`}>
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">{label}</th>
              </tr>
            </thead>
            <tbody>
              {usablePoints.map((p) => (
                <tr key={p.dateLabel}>
                  <th scope="row">{p.dateLabel}</th>
                  <td>{formatMetricValue(formatKind, p.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div role="img" aria-label={ariaLabel} className="h-14 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={usablePoints} margin={{ top: 2, right: 2, left: 2, bottom: 0 }}>
                <YAxis hide domain={["dataMin", "dataMax"]} />
                <Tooltip
                  content={(props: TooltipContentProps) => (
                    <SparklineTooltip {...props} formatKind={formatKind} />
                  )}
                  cursor={{ stroke: colors.stroke, strokeOpacity: 0.2 }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
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
        <p className="mt-3 flex items-center gap-1.5 text-[11px] text-ink/40 admin-dark:text-mist/40">
          <CircleDashed className="h-3 w-3 shrink-0" aria-hidden="true" />
          {trendUnavailableReason ?? "Not enough history yet to chart a trend."}
        </p>
      )}
    </div>
  );
}
