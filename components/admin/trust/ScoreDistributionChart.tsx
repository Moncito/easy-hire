"use client";

import { useMemo } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { TooltipContentProps } from "recharts";
import { ShieldCheck } from "lucide-react";
import type { SerializedTrustScoreDistribution, TrustDirectoryTargetType } from "./types";

/**
 * `/admin/trust` score-distribution histogram — a STATIC snapshot of where
 * the currently-scored population sits across the four risk bands, not a
 * time series, so this deliberately does not reuse
 * `UserSignupTrendChart.tsx`/`JobPostingTrendChart.tsx`'s line-chart shape.
 * Modeled instead on `components/employer/charts/pro/ProMonoFunnel.tsx`'s
 * single stacked horizontal bar (a proportional "how is this population
 * split" read, worst-to-best left-to-right), since that is the closest
 * existing precedent for "one bar, several honestly-sized segments" in this
 * codebase — a 4-bar `BarChart` would need its own axis/gridline treatment
 * for little extra clarity at this size, and this page has already earned a
 * "don't over-build" note.
 *
 * Colors are the three existing brand accents only (no new hues): ember for
 * the below-threshold band (the one band this whole page exists to
 * surface), marigold for the next band down, and teal — at two opacities,
 * not two different hues — for the two healthy bands, so "healthier" reads
 * as "more saturated teal" rather than introducing a fourth color the brand
 * palette doesn't define.
 *
 * `scoredCount === 0` renders an honest empty state (same "nothing scored
 * yet" tone as `TrustDirectory.tsx`'s own `emptyState`) instead of four
 * zero-height bars that would look like a real, if boring, distribution.
 */

type Band = {
  key: keyof SerializedTrustScoreDistribution;
  label: string;
  fill: string;
  fillOpacity: number;
};

const BANDS: Band[] = [
  { key: "belowThreshold", label: "Below 40 (risk threshold)", fill: "#D9553A", fillOpacity: 1 },
  { key: "belowBaseline", label: "40–59 (below baseline)", fill: "#F2A93B", fillOpacity: 1 },
  { key: "atOrAboveBaseline", label: "60–79 (at/above baseline)", fill: "#1F8073", fillOpacity: 0.45 },
  { key: "excellent", label: "80+ (excellent)", fill: "#1F8073", fillOpacity: 1 },
];

function DistributionTooltip({ active, payload }: TooltipContentProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-ink/10 bg-white px-2.5 py-1.5 shadow-sm admin-dark:border-white/15 admin-dark:bg-admin-dark-surface">
      <ul className="space-y-0.5">
        {payload.map((item) => (
          <li key={String(item.dataKey)} className="flex items-center justify-between gap-4 text-[11px]">
            <span className="text-ink/55 admin-dark:text-mist/55">{item.name}</span>
            <span className="font-data font-bold text-ink admin-dark:text-mist">{item.value ?? 0}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function ScoreDistributionChart({
  distribution,
  scoredCount,
  targetType,
}: {
  distribution: SerializedTrustScoreDistribution;
  scoredCount: number;
  targetType: TrustDirectoryTargetType;
}) {
  const populationLabel = targetType === "SEEKER" ? "seekers" : "companies";
  const chartData = useMemo(() => [{ name: "distribution", ...distribution }], [distribution]);

  if (scoredCount === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-ink/15 bg-mist/40 p-4 admin-dark:border-white/15 admin-dark:bg-white/5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-ink/45 admin-dark:text-mist/45">
          Score distribution
        </p>
        <div className="mt-3 flex flex-col items-center gap-1.5 py-3 text-center">
          <ShieldCheck className="h-5 w-5 text-ink/30 admin-dark:text-mist/30" aria-hidden="true" />
          <p className="text-xs text-ink/50 admin-dark:text-mist/50">
            No scored {populationLabel} yet, so there is nothing to chart.
          </p>
        </div>
      </div>
    );
  }

  const pct = (count: number) => Math.round((count / scoredCount) * 100);

  const ariaLabel = `Score distribution across ${scoredCount.toLocaleString()} scored ${populationLabel}: ${BANDS.map(
    (band) => `${band.label}, ${distribution[band.key]} accounts, ${pct(distribution[band.key])} percent`
  ).join("; ")}.`;

  return (
    <div className="rounded-2xl border border-ink/5 bg-white p-4 admin-dark:border-white/10 admin-dark:bg-white/5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-ink/45 admin-dark:text-mist/45">
          Score distribution
        </p>
        <span className="font-data text-[10px] font-semibold text-ink/40 admin-dark:text-mist/40">
          {scoredCount.toLocaleString()} scored {populationLabel}
        </span>
      </div>

      <table className="sr-only" aria-label={`Score distribution — ${populationLabel}`}>
        <thead>
          <tr>
            <th scope="col">Band</th>
            <th scope="col">Accounts</th>
            <th scope="col">Share</th>
          </tr>
        </thead>
        <tbody>
          {BANDS.map((band) => (
            <tr key={band.key}>
              <th scope="row">{band.label}</th>
              <td>{distribution[band.key]}</td>
              <td>{pct(distribution[band.key])}%</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
        {BANDS.map((band) => (
          <span
            key={band.key}
            className="inline-flex items-center gap-1.5 text-[11px] text-ink/55 admin-dark:text-mist/55"
          >
            <span
              className="h-2 w-2 shrink-0 rounded-sm"
              style={{ backgroundColor: band.fill, opacity: band.fillOpacity }}
              aria-hidden="true"
            />
            {band.label}
            <span className="font-data font-bold text-ink admin-dark:text-mist">
              {distribution[band.key]}
              <span className="font-normal text-ink/40 admin-dark:text-mist/40"> ({pct(distribution[band.key])}%)</span>
            </span>
          </span>
        ))}
      </div>

      <div role="img" aria-label={ariaLabel} className="mt-3 h-9 w-full overflow-hidden">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart layout="vertical" data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }} barSize={26}>
            <XAxis type="number" hide domain={[0, "dataMax"]} />
            <YAxis type="category" dataKey="name" hide />
            <Tooltip cursor={false} content={(props: TooltipContentProps) => <DistributionTooltip {...props} />} />
            {BANDS.map((band, index) => (
              <Bar
                key={band.key}
                dataKey={band.key}
                name={band.label}
                stackId="distribution"
                fill={band.fill}
                fillOpacity={band.fillOpacity}
                isAnimationActive={false}
                radius={index === 0 ? [8, 0, 0, 8] : index === BANDS.length - 1 ? [0, 8, 8, 0] : 0}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
