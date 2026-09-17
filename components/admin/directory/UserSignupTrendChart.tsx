"use client";

import { useMemo } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { TooltipContentProps } from "recharts";
import { CircleDashed, TrendingUp } from "lucide-react";
import { useAdminChartTheme } from "@/components/admin/dashboard/useAdminChartTheme";
import { SPARKLINE_COLORS } from "@/components/admin/dashboard/chartColors";
import type { SerializedUserSignupTrendPoint } from "./types";

/**
 * `/admin/users` analytics band — the signup trend half of it. Deliberately
 * modeled on `MetricSparklineTile.tsx`'s three-states discipline rather than
 * inventing a new shape: an empty series and a series too short to read as a
 * real trend both get an honest, visibly-quieter treatment instead of a
 * chart drawn off almost nothing.
 *
 * ONE line (total signups), not a stacked/multi-series breakdown — the
 * per-role split (`byRole`) is real data and worth keeping, but it lives in
 * the tooltip and the `sr-only` table instead of a second/third series on
 * the chart itself. `platform_daily_rollups` is young enough on this
 * dataset that a seeker line + an employer line at this chart's size would
 * mostly be two nearly-flat, hard-to-distinguish traces — a muddier read
 * than one clean total line, which is the actual "don't combine things that
 * make a chart worse" call here.
 */

const MIN_TREND_POINTS = 3;

type TrendDatum = { dateLabel: string; total: number; byRole: Record<string, number> };

function formatDateLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function SignupTrendTooltip({ active, payload }: TooltipContentProps) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload as TrendDatum | undefined;
  if (!point) return null;
  const roleEntries = Object.entries(point.byRole).filter(([, count]) => count > 0);
  return (
    <div className="rounded-lg border border-ink/10 bg-white px-2.5 py-1.5 shadow-sm admin-dark:border-white/15 admin-dark:bg-admin-dark-surface">
      <p className="font-data text-[10px] text-ink/45 admin-dark:text-mist/45">{point.dateLabel}</p>
      <p className="font-data text-xs font-bold text-ink admin-dark:text-mist">
        {point.total} signup{point.total === 1 ? "" : "s"}
      </p>
      {roleEntries.length > 0 && (
        <ul className="mt-1 space-y-0.5">
          {roleEntries.map(([role, count]) => (
            <li key={role} className="font-data text-[10px] text-ink/55 admin-dark:text-mist/55">
              {role}: {count}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function UserSignupTrendChart({
  signupTrend,
}: {
  /** `lib/admin/users.ts`'s `getUserSignupTrend()` — ascending by date, however many `platform_daily_rollups` rows actually exist. Never padded/interpolated upstream. */
  signupTrend: SerializedUserSignupTrendPoint[];
}) {
  const theme = useAdminChartTheme();
  const colors = SPARKLINE_COLORS[theme];

  const points = useMemo<TrendDatum[]>(
    () => signupTrend.map((p) => ({ dateLabel: formatDateLabel(p.date), total: p.total, byRole: p.byRole })),
    [signupTrend]
  );

  const hasEnoughHistory = points.length >= MIN_TREND_POINTS;
  const totalInWindow = points.reduce((sum, p) => sum + p.total, 0);

  if (points.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-ink/15 bg-mist/40 p-4 admin-dark:border-white/15 admin-dark:bg-white/5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-ink/45 admin-dark:text-mist/45">
          New signups
        </p>
        <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-dashed border-ink/20 bg-ink/5 px-2 py-0.5 text-[11px] font-semibold text-ink/50 admin-dark:border-white/20 admin-dark:bg-white/10 admin-dark:text-mist/55">
          <CircleDashed className="h-3 w-3 shrink-0" aria-hidden="true" />
          Not enough data
        </div>
        <p className="mt-2 text-xs text-ink/50 admin-dark:text-mist/50">
          No daily signup rollups have been recorded yet.
        </p>
      </div>
    );
  }

  const rangeLabel =
    points.length > 1 ? `${points[0].dateLabel} to ${points[points.length - 1].dateLabel}` : points[0].dateLabel;
  const ariaLabel = `New signups: ${totalInWindow} total user${totalInWindow === 1 ? "" : "s"} across ${
    points.length
  } recorded day${points.length === 1 ? "" : "s"}, ${rangeLabel}.${
    hasEnoughHistory ? " Trend chart shown below." : ""
  }`;

  return (
    <div className="rounded-2xl border border-ink/5 border-l-[3px] border-l-navy bg-white p-4 admin-dark:border-white/10 admin-dark:border-l-teal admin-dark:bg-white/5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-ink/45 admin-dark:text-mist/45">
          New signups
        </p>
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-ink/40 admin-dark:text-mist/40">
          <TrendingUp className="h-3 w-3 shrink-0" aria-hidden="true" />
          Last {points.length} recorded day{points.length === 1 ? "" : "s"}
        </span>
      </div>
      <p className="mt-1 font-data text-3xl font-bold text-ink admin-dark:text-mist">{totalInWindow.toLocaleString()}</p>
      <p className="text-xs text-ink/45 admin-dark:text-mist/45">total new accounts across seekers, employers and admins</p>

      {hasEnoughHistory ? (
        <div className="mt-3">
          <table className="sr-only" aria-label="New signups — daily history">
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Total</th>
                <th scope="col">By role</th>
              </tr>
            </thead>
            <tbody>
              {points.map((p) => (
                <tr key={p.dateLabel}>
                  <th scope="row">{p.dateLabel}</th>
                  <td>{p.total}</td>
                  <td>
                    {Object.entries(p.byRole)
                      .filter(([, count]) => count > 0)
                      .map(([role, count]) => `${role}: ${count}`)
                      .join(", ") || "none"}
                  </td>
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
                  content={(props: TooltipContentProps) => <SignupTrendTooltip {...props} />}
                  cursor={{ stroke: colors.stroke, strokeOpacity: 0.2 }}
                />
                <Area
                  type="monotone"
                  dataKey="total"
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
                {p.dateLabel}: {p.total} signup{p.total === 1 ? "" : "s"}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
