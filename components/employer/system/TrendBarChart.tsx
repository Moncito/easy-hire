"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { TooltipContentProps } from "recharts";

export type ChartSeries = {
  key: string;
  name: string;
  tone: "ink" | "marigold" | "teal";
};

const COLOR: Record<ChartSeries["tone"], string> = {
  ink: "var(--eh-ink)",
  marigold: "var(--eh-marigold)",
  teal: "var(--eh-teal)",
};

const TICK = { fill: "var(--eh-muted)", fontSize: 11 } as const;

type Datum = { label: string; tooltipLabel?: string } & Record<string, number | string | undefined>;

function ChartTooltip({ active, payload }: TooltipContentProps) {
  if (!active || !payload?.length) return null;
  const datum = payload[0]?.payload as Datum | undefined;
  return (
    <div className="rounded-control border border-eh-line bg-eh-surface px-3 py-2 shadow-eh-md">
      <p className="text-xs text-eh-muted">{datum?.tooltipLabel ?? datum?.label}</p>
      <ul className="mt-1.5 space-y-1">
        {payload.map((item) => (
          <li key={String(item.dataKey)} className="flex items-center justify-between gap-6 text-xs">
            <span className="flex items-center gap-1.5 text-eh-ink-2">
              <i className="h-2 w-2 rounded-[2px]" style={{ backgroundColor: String(item.color) }} aria-hidden="true" />
              {item.name}
            </span>
            <span className="num font-semibold text-eh-ink">{item.value ?? 0}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Grouped daily bars on Recharts, themed with the workspace tokens so it
 * follows light/dark. Y axis starts at 0 with whole-number ticks; X labels
 * thin out by `labelEvery`. A screen-reader table carries the same numbers.
 * Show EmptyState instead of this when there's no data — never a flat chart.
 */
export default function TrendBarChart({
  data,
  series,
  labelEvery = 1,
  height = 220,
  ariaLabel,
}: {
  data: Datum[];
  series: ChartSeries[];
  /** Show every Nth x label (1 for 7 days, 7 for 30, 10 for 60). Counted back from the latest day. */
  labelEvery?: number;
  height?: number;
  ariaLabel: string;
}) {
  const last = data.length - 1;
  return (
    <>
      <table className="sr-only">
        <caption>{ariaLabel}</caption>
        <thead>
          <tr>
            <th scope="col">Day</th>
            {series.map((s) => (
              <th key={s.key} scope="col">
                {s.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={String(d.tooltipLabel ?? d.label)}>
              <th scope="row">{d.tooltipLabel ?? d.label}</th>
              {series.map((s) => (
                <td key={s.key}>{d[s.key] ?? 0}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div role="img" aria-label={ariaLabel} style={{ height }} className="w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={2} barCategoryGap="24%" margin={{ top: 8, right: 4, left: -18, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--eh-line)" />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={TICK}
              interval={0}
              tickFormatter={(value: string, index: number) => ((last - index) % labelEvery === 0 ? value : "")}
              minTickGap={0}
            />
            <YAxis
              allowDecimals={false}
              axisLine={false}
              tickLine={false}
              tick={TICK}
              width={36}
              domain={[0, (max: number) => Math.max(max, 4)]}
            />
            <Tooltip cursor={{ fill: "var(--eh-surface-2)" }} content={ChartTooltip} />
            {series.map((s) => (
              <Bar key={s.key} dataKey={s.key} name={s.name} fill={COLOR[s.tone]} radius={[3, 3, 0, 0]} maxBarSize={14} isAnimationActive={false} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}
