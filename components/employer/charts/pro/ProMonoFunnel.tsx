"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { TooltipContentProps } from "recharts";

const INK = "#20242B";

type Funnel = {
  applied: number;
  reviewed: number;
  interview: number;
  hired: number;
};

const STAGES = [
  { key: "applied" as const, label: "Applied", fill: INK, opacity: 1 },
  { key: "reviewed" as const, label: "Reviewed", fill: INK, opacity: 0.62 },
  { key: "interview" as const, label: "Interview", fill: INK, opacity: 0.32 },
  { key: "hired" as const, label: "Hired", fill: "#F2A93B", opacity: 1 },
];

function FunnelTooltip({ active, payload }: TooltipContentProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-ink/10 bg-white px-3 py-2 shadow-sm">
      <ul className="space-y-1">
        {payload.map((item) => (
          <li key={String(item.dataKey)} className="flex items-center justify-between gap-6 text-xs">
            <span className="text-ink/60">{item.name}</span>
            <span className="font-data font-bold text-ink">{item.value ?? 0}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

type Props = {
  funnel: Funnel;
};

/** Single stacked pipeline bar — ink scale, marigold for Hired. */
export default function ProMonoFunnel({ funnel }: Props) {
  const total = STAGES.reduce((sum, stage) => sum + funnel[stage.key], 0);
  const chartData = [
    {
      name: "Pipeline",
      applied: funnel.applied,
      reviewed: funnel.reviewed,
      interview: funnel.interview,
      hired: funnel.hired,
    },
  ];

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink/55">
        {STAGES.map((stage) => (
          <span key={stage.key} className="inline-flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-sm"
              style={{ backgroundColor: stage.fill, opacity: stage.opacity }}
              aria-hidden="true"
            />
            {stage.label}
            <span className="font-data font-bold text-ink">{funnel[stage.key]}</span>
          </span>
        ))}
      </div>

      {total === 0 ? (
        <div className="h-7 w-full rounded-full bg-ink/[0.06]" aria-label="No pipeline activity yet" />
      ) : (
        <div className="h-10 w-full overflow-hidden" role="img" aria-label="Hiring pipeline stacked bar">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={chartData}
              margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
              barSize={28}
            >
              <XAxis type="number" hide domain={[0, "dataMax"]} />
              <YAxis type="category" dataKey="name" hide />
              <Tooltip cursor={false} content={FunnelTooltip} />
              {STAGES.map((stage, index) => (
                <Bar
                  key={stage.key}
                  dataKey={stage.key}
                  name={stage.label}
                  stackId="pipeline"
                  fill={stage.fill}
                  fillOpacity={stage.opacity}
                  radius={
                    index === 0
                      ? [14, 0, 0, 14]
                      : index === STAGES.length - 1
                        ? [0, 14, 14, 0]
                        : 0
                  }
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
