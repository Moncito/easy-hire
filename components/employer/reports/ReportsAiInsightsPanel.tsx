"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { useEasyAi } from "@/components/employer/pro/useEasyAi";
import NeoSurface from "@/components/employer/pro/NeoSurface";
import NeoButton from "@/components/employer/pro/NeoButton";

type InsightsResult = { narrative: string; highlights: string[] };

/** Employer Pro-only — this component is only ever rendered inside
 * `ReportsDenseBoard`, which the reports page already gates to Pro. */
export default function ReportsAiInsightsPanel() {
  const { run, isLoading } = useEasyAi();
  const [insights, setInsights] = useState<InsightsResult | null>(null);

  async function handleGenerate() {
    const result = await run<InsightsResult>("insights", {});
    if (result?.configured && result.data) setInsights(result.data);
  }

  return (
    <NeoSurface variant="raised" className="mb-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <span className="neo-inset-sm flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[color:var(--neo-gold)]">
            <Sparkles className="h-4 w-4" strokeWidth={2.25} />
          </span>
          <div>
            <p className="text-sm font-bold text-[color:var(--neo-ink)]">Easy AI hiring narrative</p>
            <p className="mt-0.5 text-xs leading-relaxed text-[color:var(--neo-muted)]">
              A plain-language read on this week&apos;s funnel — review before acting on it.
            </p>
          </div>
        </div>
        <NeoButton variant="secondary" size="sm" onClick={handleGenerate} disabled={isLoading("insights")}>
          {isLoading("insights") ? "Thinking…" : insights ? "Refresh" : "Generate"}
        </NeoButton>
      </div>
      {insights && (
        <div className="neo-inset-sm mt-3 rounded-xl p-3.5">
          <p className="text-xs leading-relaxed text-[color:var(--neo-ink)]">{insights.narrative}</p>
          {insights.highlights.length > 0 && (
            <ul className="mt-2 space-y-1">
              {insights.highlights.map((h, i) => (
                <li key={i} className="text-[11px] leading-relaxed text-[color:var(--neo-muted)]">
                  • {h}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </NeoSurface>
  );
}
