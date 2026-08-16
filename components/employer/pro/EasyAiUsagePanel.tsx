"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { fetchJsonSafe } from "@/lib/client/fetch-json";
import ProUsageBar from "@/components/employer/pro/ProUsageBar";

type UsageSummaryRow = { feature: string; count: number; tokens: number };
type RecentUsageRow = { feature: string; createdAt: string };
type UsageResponse = { summary: UsageSummaryRow[]; recent: RecentUsageRow[]; limit: number };

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

function featureLabel(feature: string) {
  return FEATURE_LABELS[feature] ?? feature;
}

/**
 * Employer Pro Easy AI hub usage summary — last 30 days, per feature, from
 * `GET /api/employer/ai/usage`. Fetched client-side so the hub page stays a
 * server component; falls back to a static note if usage hasn't loaded yet
 * or the account has no generations yet.
 */
export default function EasyAiUsagePanel() {
  const [usage, setUsage] = useState<UsageResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const result = await fetchJsonSafe<UsageResponse>("/api/employer/ai/usage", {
        cache: "no-store",
      });
      if (!active) return;
      if (result.ok) setUsage(result.data);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  const totalCount = usage?.summary.reduce((sum, row) => sum + row.count, 0) ?? 0;
  const topFeatures = [...(usage?.summary ?? [])].sort((a, b) => b.count - a.count).slice(0, 4);

  return (
    <div className="flex w-full flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <span className="neo-inset-sm flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[color:var(--neo-gold)]">
          <Sparkles className="h-5 w-5" strokeWidth={2.25} />
        </span>
        <div>
          <p className="text-sm font-semibold text-[color:var(--neo-ink)]">
            {loading
              ? "Usage this month"
              : totalCount > 0
                ? `${totalCount} generation${totalCount === 1 ? "" : "s"} in the last 30 days`
                : "Usage this month"}
          </p>
          <p className="text-xs text-[color:var(--neo-muted)]">
            {loading
              ? "Loading your Easy AI usage…"
              : totalCount > 0
                ? "Every generation is metered per feature, per hour — limits surface inline if you hit one."
                : `No generations yet — try a shortcut below. Each feature allows up to ${usage?.limit ?? 30} generations per hour.`}
          </p>
        </div>
      </div>

      {topFeatures.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {topFeatures.map((row) => (
            <span
              key={row.feature}
              className="neo-inset-sm rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-[color:var(--neo-muted)]"
            >
              {featureLabel(row.feature)}
              <span className="ml-1.5 font-data text-[color:var(--neo-teal)]">{row.count}</span>
            </span>
          ))}
        </div>
      )}

      <ProUsageBar
        limit={usage?.limit ?? 30}
        recent={usage?.recent ?? []}
        loading={loading}
        monthlyTotal={totalCount}
      />
    </div>
  );
}
