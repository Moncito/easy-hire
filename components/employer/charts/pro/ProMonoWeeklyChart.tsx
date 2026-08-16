"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TooltipContentProps } from "recharts";

export type ProWeeklyPoint = {
  label: string;
  applications: number;
  interviews: number;
};

const INK = "#20242B";
const MARIGOLD = "#F2A93B";
const GRID = "rgba(32, 36, 43, 0.08)";
const TICK = "rgba(32, 36, 43, 0.45)";
const TICK_FONT = 'var(--font-ibm-plex-mono), ui-monospace, monospace';

function MonoTooltip({ active, payload, label }: TooltipContentProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-ink/10 bg-white px-3 py-2 shadow-sm">
      <p className="font-data text-xs text-ink/45">{label}</p>
      <ul className="mt-1.5 space-y-1">
        {payload.map((item) => (
          <li key={String(item.dataKey)} className="flex items-center justify-between gap-6 text-xs">
            <span className="flex items-center gap-1.5 text-ink/60">
              <span
                className="h-2 w-2 rounded-sm"
                style={{ backgroundColor: String(item.color ?? INK) }}
                aria-hidden="true"
              />
              {item.name}
            </span>
            <span className="font-data font-bold text-ink">{item.value ?? 0}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

type Props = {
  data: ProWeeklyPoint[];
};

/** Monochrome grouped bars — Recharts, Pro-only. Always renders, including a zero week. */
export default function ProMonoWeeklyChart({ data }: Props) {
  const totalApps = data.reduce((sum, day) => sum + day.applications, 0);
  const totalInterviews = data.reduce((sum, day) => sum + day.interviews, 0);
  const ariaLabel = `Weekly hiring activity. ${totalApps} application${totalApps === 1 ? "" : "s"} and ${totalInterviews} interview move${totalInterviews === 1 ? "" : "s"} over the last 7 days.`;

  return (
    <div className="space-y-4">
      <table className="sr-only" aria-label="Weekly hiring activity data">
        <thead>
          <tr>
            <th scope="col">Day</th>
            <th scope="col">Applications</th>
            <th scope="col">Interview moves</th>
          </tr>
        </thead>
        <tbody>
          {data.map((day) => (
            <tr key={day.label}>
              <th scope="row">{day.label}</th>
              <td>{day.applications}</td>
              <td>{day.interviews}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex items-center gap-4 text-xs" aria-hidden="true">
        <span className="flex items-center gap-1.5 text-ink/55">
          <span className="h-2.5 w-2.5 rounded-sm bg-ink" />
          Applications
        </span>
        <span className="flex items-center gap-1.5 text-ink/55">
          <span className="h-2.5 w-2.5 rounded-sm bg-marigold" />
          Interviews
        </span>
      </div>

      <div role="img" aria-label={ariaLabel} className="h-[220px] w-full overflow-hidden">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={3} barCategoryGap="28%" margin={{ top: 8, right: 4, left: -18, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke={GRID} strokeDasharray="0" />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fill: TICK, fontSize: 11, fontFamily: TICK_FONT }}
            />
            <YAxis
              allowDecimals={false}
              axisLine={false}
              tickLine={false}
              tick={{ fill: TICK, fontSize: 11, fontFamily: TICK_FONT }}
              width={36}
              domain={[0, (max: number) => Math.max(max, 4)]}
            />
            <Tooltip
              cursor={{ fill: "rgba(32, 36, 43, 0.04)" }}
              content={MonoTooltip}
            />
            <Bar dataKey="applications" name="Applications" fill={INK} radius={[4, 4, 0, 0]} maxBarSize={18} />
            <Bar dataKey="interviews" name="Interviews" fill={MARIGOLD} radius={[4, 4, 0, 0]} maxBarSize={18} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
