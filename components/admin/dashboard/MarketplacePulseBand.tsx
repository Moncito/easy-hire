import type { MarketplacePulse } from "@/lib/admin/home-dashboard";
import { StatTile } from "@/components/admin/statTiles";
import MetricSparklineTile from "./MetricSparklineTile";

/**
 * Band 1 — Marketplace pulse (docs/ADMIN-CONSOLE-PLAN.md §4.1): "Liquidity
 * first ... because a queue you can clear tells you nothing about whether
 * the business works." Fill rate 30d and median time-to-first-applicant
 * each get their OWN single-axis sparkline tile (never combined — different
 * units/scales, the dataviz skill's "#1 chart mistake"); response rate 72h
 * has no rollup-backed history yet (see `home-dashboard.ts`'s own doc
 * comment on `computePlatformResponseRate72h`), so its tile renders the
 * current value with an explicit "not tracked yet" note instead of a chart.
 * Active supply/demand is a live, always-real gauge — no chart, no history,
 * just the current numbers, per the plan's own "no chart needed" framing.
 */

function formatRatio(ratio: number): string {
  return `${ratio.toFixed(1)}×`;
}

export default function MarketplacePulseBand({ pulse }: { pulse: MarketplacePulse }) {
  const { fillRate30d, responseRate72h, medianTimeToFirstApplicantHours, activeSupplyDemand, trend } = pulse;

  // Raw dated series, mapped down to the ONE field each tile charts. A day
  // whose rollup recorded a null rate/median (zero qualifying jobs that day)
  // is filtered out inside MetricSparklineTile itself, not here — this is
  // just the field projection.
  const fillRateTrend = trend.map((point) => ({ date: point.date, value: point.fillRate.rate }));
  const medianTrend = trend.map((point) => ({
    date: point.date,
    value: point.medianTimeToFirstApplicantHours.hours,
  }));

  return (
    <section aria-labelledby="marketplace-pulse-heading" className="space-y-6">
      <div>
        <h2
          id="marketplace-pulse-heading"
          className="font-display text-xl font-bold tracking-tight text-ink admin-dark:text-mist"
        >
          Marketplace pulse
        </h2>
        <p className="mt-1 text-sm text-ink/55 admin-dark:text-mist/55">
          Liquidity first — whether the marketplace is actually matching supply with demand.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <MetricSparklineTile
          label="Fill rate (30d)"
          metric={fillRate30d}
          trendPoints={fillRateTrend}
          formatKind="percent"
          sampleSizeText={
            fillRate30d ? `${fillRate30d.sampleSize} job${fillRate30d.sampleSize === 1 ? "" : "s"} published in window` : undefined
          }
          emptyReason="No jobs were published in the last 30 days, so a fill rate cannot be honestly computed yet."
        />
        <MetricSparklineTile
          label="Response rate (72h)"
          metric={responseRate72h}
          trendPoints={[]}
          formatKind="percent"
          sampleSizeText={
            responseRate72h
              ? `${responseRate72h.sampleSize} application${responseRate72h.sampleSize === 1 ? "" : "s"} with a known 72h outcome`
              : undefined
          }
          emptyReason="Too few applications have a known 72-hour response outcome yet to compute a rate."
          trendUnavailableReason="Not stored in the daily rollup yet, so there is no history to chart — see lib/admin/home-dashboard.ts."
        />
        <MetricSparklineTile
          label="Median time to first applicant"
          metric={medianTimeToFirstApplicantHours}
          trendPoints={medianTrend}
          formatKind="hours"
          sampleSizeText={
            medianTimeToFirstApplicantHours
              ? `${medianTimeToFirstApplicantHours.sampleSize} job${medianTimeToFirstApplicantHours.sampleSize === 1 ? "" : "s"} with ≥1 applicant`
              : undefined
          }
          emptyReason="No published job in the last 30 days has received an application yet."
        />
      </div>

      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink/45 admin-dark:text-mist/45">
          Active supply / demand
        </h3>
        <div className="grid gap-3 sm:grid-cols-3">
          {/* Marigold (seeker-side) / Teal (employer-side) — ties this band
              back to the same semantic color system the sidebar already
              established, instead of every number defaulting to plain ink. */}
          <StatTile label="Active seekers" value={activeSupplyDemand.activeSeekers.toLocaleString()} tone="marigold" />
          <StatTile label="Active jobs" value={activeSupplyDemand.activeJobs.toLocaleString()} tone="teal" />
          <StatTile
            label="Seekers per job"
            value={activeSupplyDemand.ratio === null ? "n/a" : formatRatio(activeSupplyDemand.ratio)}
            tone={activeSupplyDemand.ratio === null ? "muted" : "default"}
          />
        </div>
        {activeSupplyDemand.ratio === null && (
          <p className="mt-2 text-xs text-ink/45 admin-dark:text-mist/45">
            No active jobs right now, so a seekers-per-job ratio is undefined — this is a structural
            &ldquo;no denominator&rdquo; state, not a small-sample null.
          </p>
        )}
      </div>
    </section>
  );
}
