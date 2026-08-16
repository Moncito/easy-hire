"use client";

import { useMemo } from "react";

type RecentEvent = {
  feature: string;
  createdAt: string;
};

type Props = {
  limit: number;
  recent: RecentEvent[];
  loading?: boolean;
  /** Total generations in the last 30 days (from usage summary). */
  monthlyTotal?: number;
};

function computePeakHourlyUsage(recent: RecentEvent[]) {
  const hourAgo = Date.now() - 60 * 60 * 1000;
  const byFeature = new Map<string, number>();

  for (const event of recent) {
    const at = new Date(event.createdAt).getTime();
    if (Number.isNaN(at) || at < hourAgo) continue;
    byFeature.set(event.feature, (byFeature.get(event.feature) ?? 0) + 1);
  }

  let peakFeature = "";
  let peakCount = 0;
  for (const [feature, count] of byFeature) {
    if (count > peakCount) {
      peakCount = count;
      peakFeature = feature;
    }
  }

  return { peakFeature, peakCount };
}

const FEATURE_LABELS: Record<string, string> = {
  "job-copy": "JD Writer",
  rank: "Match Rank",
  interview: "Interview Kit",
  "message-draft": "Outreach Drafts",
  insights: "Hiring Insights",
  "screening-questions": "Screening Questions",
  "company-brand": "Company Brand",
  "bulk-shortlist": "Bulk Shortlist",
  "resume-highlights": "Resume Highlights",
  "job-tips": "Job Tips",
  "spam-flag": "Spam Flag",
};

/**
 * Hourly Easy AI quota bar for the Pro hub. Uses existing `/api/employer/ai/usage`
 * `recent` events to estimate the busiest feature this hour vs the per-feature limit.
 */
export default function ProUsageBar({ limit, recent, loading = false, monthlyTotal }: Props) {
  const { peakFeature, peakCount } = useMemo(() => computePeakHourlyUsage(recent), [recent]);
  const safeLimit = Math.max(limit, 1);
  const fillPct = Math.min(100, Math.round((peakCount / safeLimit) * 100));
  const nearLimit = peakCount >= safeLimit * 0.8;
  const atLimit = peakCount >= safeLimit;

  const featureLabel = peakFeature
    ? (FEATURE_LABELS[peakFeature] ?? peakFeature)
    : "any feature";

  return (
    <div className="mt-4 border-t border-ink/6 pt-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-ink/55">Hourly quota</p>
          <p className="mt-0.5 text-sm text-ink/60">
            {loading
              ? "Loading quota…"
              : peakCount > 0
                ? `${peakCount} of ${safeLimit} generations this hour on ${featureLabel}`
                : `Up to ${safeLimit} generations per feature each hour`}
          </p>
        </div>
        {!loading && monthlyTotal !== undefined && monthlyTotal > 0 && (
          <p className="font-data text-xs text-ink/45">
            {monthlyTotal} in last 30 days
          </p>
        )}
      </div>

      <div
        className="mt-3 h-2 overflow-hidden rounded-full bg-ink/8"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={safeLimit}
        aria-valuenow={loading ? 0 : peakCount}
        aria-label={
          loading
            ? "Easy AI hourly quota loading"
            : `Easy AI hourly quota: ${peakCount} of ${safeLimit} on ${featureLabel}`
        }
      >
        <div
          className={`h-full rounded-full transition-[width] duration-300 ${
            atLimit ? "bg-ember" : nearLimit ? "bg-teal/80" : "bg-teal"
          }`}
          style={{ width: loading ? "0%" : `${fillPct}%` }}
        />
      </div>

      {!loading && atLimit && (
        <p className="mt-2 text-xs text-ember">
          Hourly limit reached for {featureLabel}. Wait for the window to reset or try another feature.
        </p>
      )}
    </div>
  );
}
