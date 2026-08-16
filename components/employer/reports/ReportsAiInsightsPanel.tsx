"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { useEasyAi } from "@/components/employer/pro/useEasyAi";

type InsightsResult = { narrative: string; highlights: string[] };

export default function ReportsAiInsightsPanel() {
  const { run, isLoading } = useEasyAi();
  const [insights, setInsights] = useState<InsightsResult | null>(null);

  async function handleGenerate() {
    const result = await run<InsightsResult>("insights", {});
    if (result?.configured && result.data) setInsights(result.data);
  }

  return (
    <div className="pro-card mb-6 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-marigold/15 text-[#9A5B12]">
            <Sparkles className="h-4 w-4" strokeWidth={2.25} />
          </span>
          <div>
            <p className="text-base font-bold text-ink">Easy AI hiring narrative</p>
            <p className="mt-0.5 text-sm leading-relaxed text-ink/50">
              A plain-language read on this week&apos;s funnel — review before acting on it.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={isLoading("insights")}
          className="rounded-full border border-ink/10 bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:border-ink/20 hover:bg-ink/[0.02] disabled:opacity-60"
        >
          {isLoading("insights") ? "Thinking…" : insights ? "Refresh" : "Generate"}
        </button>
      </div>
      {insights && (
        <div className="mt-4 rounded-xl border border-ink/[0.06] bg-mist/40 p-4">
          <p className="text-sm leading-relaxed text-ink/75">{insights.narrative}</p>
          {insights.highlights.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {insights.highlights.map((h, i) => (
                <li key={i} className="text-sm leading-relaxed text-ink/55">
                  • {h}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
