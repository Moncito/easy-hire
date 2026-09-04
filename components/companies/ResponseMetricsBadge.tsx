/**
 * Public "response rate / median response time" badge — Phase 4.3.
 *
 * Backed by `Company.responseRate` / `medianResponseMinutes` /
 * `responseSampleSize` (see `lib/employer/response-metrics.ts`). All three
 * can independently be null — this component renders three distinct,
 * honest states instead of ever showing a bare 0% or blank as if it were a
 * real signal:
 *
 *  1. `responseRate` present → real measured data. `medianResponseMinutes`
 *     is shown alongside it when also present; a company can legitimately
 *     have a 0% rate with no timed responses at all (median null), which is
 *     still real data and rendered as such, just without a median line.
 *  2. `responseRate` null but `responseSampleSize` present → thin data
 *     (below `RESPONSE_METRICS_MIN_SAMPLE`, currently 5) — "not enough
 *     applicants yet", not a warning.
 *  3. Both null → nothing has been computed yet (e.g. no jobs posted).
 *
 * `responseRate` is the percent of qualifying applications that got *any*
 * employer engagement within the rolling window — a rejection counts as a
 * response. Never phrase this as a hiring-likelihood metric.
 */

export type ResponseMetricsBadgeProps = {
  responseRate: number | null;
  medianResponseMinutes: number | null;
  responseSampleSize: number | null;
  size?: "sm" | "default";
};

/** Humanizes a raw minute count the way a person would say it out loud. */
export function formatMedianResponseTime(minutes: number): string {
  if (minutes < 60) return "under 1 hour";
  if (minutes < 60 * 24) {
    const hours = Math.ceil(minutes / 60);
    return hours <= 1 ? "under 1 hour" : `under ${hours} hours`;
  }
  const days = Math.max(1, Math.round(minutes / (60 * 24)));
  return `${days} day${days === 1 ? "" : "s"}`;
}

function sampleSuffix(sampleSize: number | null): string {
  if (sampleSize === null) return "";
  return ` (based on ${sampleSize} application${sampleSize === 1 ? "" : "s"} in the last 90 days)`;
}

export default function ResponseMetricsBadge({
  responseRate,
  medianResponseMinutes,
  responseSampleSize,
  size = "default",
}: ResponseMetricsBadgeProps) {
  const sm = size === "sm";
  const hasRate = responseRate !== null;
  const humanizedMedian =
    hasRate && medianResponseMinutes !== null ? formatMedianResponseTime(medianResponseMinutes) : null;

  if (hasRate) {
    const label = humanizedMedian
      ? `${responseRate}% of recent applicants heard back from this employer, including declines, typically within ${humanizedMedian}${sampleSuffix(responseSampleSize)}.`
      : `${responseRate}% of recent applicants heard back from this employer, including declines${sampleSuffix(responseSampleSize)}.`;

    return (
      <div role="group" aria-label={label} className={sm ? "flex items-center gap-2" : "flex flex-col gap-1"}>
        <div className={sm ? "flex items-baseline gap-1.5" : "flex items-baseline gap-2"} aria-hidden="true">
          <span className={`font-data font-bold text-teal ${sm ? "text-base" : "text-2xl"}`}>
            {responseRate}%
          </span>
          <span className={`font-medium text-ink/55 ${sm ? "text-xs" : "text-sm"}`}>response rate</span>
        </div>
        <p className={`text-ink/45 ${sm ? "text-[11px]" : "text-sm"}`} aria-hidden="true">
          {humanizedMedian
            ? `Typically responds within ${humanizedMedian}`
            : "No timed responses in this window yet"}
          {responseSampleSize !== null &&
            ` · ${responseSampleSize} applicant${responseSampleSize === 1 ? "" : "s"} tracked`}
        </p>
      </div>
    );
  }

  const hasSampleCount = responseSampleSize !== null;
  const label = hasSampleCount
    ? `Not enough recent applicant activity yet to publish a response rate for this employer — ${responseSampleSize} application${responseSampleSize === 1 ? "" : "s"} tracked so far.`
    : "Response rate data isn't available yet for this employer.";

  return (
    <div role="group" aria-label={label} className={sm ? "flex items-center gap-2" : "flex flex-col gap-1"}>
      <p className={`font-display font-bold text-ink/70 ${sm ? "text-xs" : "text-base"}`} aria-hidden="true">
        Not enough data yet
      </p>
      <p className={`text-ink/45 ${sm ? "text-[11px]" : "text-sm"}`} aria-hidden="true">
        {hasSampleCount
          ? `${responseSampleSize} applicant${responseSampleSize === 1 ? "" : "s"} so far — check back soon.`
          : "This employer hasn't had any tracked applications yet."}
      </p>
    </div>
  );
}
