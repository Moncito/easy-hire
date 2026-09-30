"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/employer/system";
import { useEasyAi } from "@/components/employer/pro/useEasyAi";

type InsightsResult = { narrative: string; highlights: string[] };

/** Easy AI's plain-language read on the funnel. Teal, like every Easy AI surface. */
export default function ReportsAiInsightsPanel() {
  const { run, isLoading } = useEasyAi();
  const [insights, setInsights] = useState<InsightsResult | null>(null);
  const loading = isLoading("insights");

  async function handleGenerate() {
    const result = await run<InsightsResult>("insights", {});
    if (result?.configured && result.data) setInsights(result.data);
  }

  return (
    <section
      aria-labelledby="reports-ai-heading"
      className="rounded-card border border-[color-mix(in_srgb,var(--eh-teal)_22%,transparent)] bg-eh-teal-tint p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-control bg-eh-teal text-white" aria-hidden="true">
            <Sparkles className="h-[18px] w-[18px]" />
          </span>
          <div>
            <h2 id="reports-ai-heading" className="font-heading text-[18px] font-semibold tracking-[-0.01em] text-eh-ink">
              Easy AI hiring narrative
            </h2>
            <p className="mt-0.5 text-ui text-eh-ink-2">
              A plain-language read on this week&apos;s funnel — review before acting on it.
            </p>
          </div>
        </div>
        <Button icon={<Sparkles />} loading={loading} onClick={() => void handleGenerate()}>
          {loading ? "Thinking…" : insights ? "Refresh" : "Generate"}
        </Button>
      </div>
      {insights && (
        <div className="mt-4 rounded-control border border-eh-line bg-eh-surface p-4">
          <p className="text-body text-eh-ink-2">{insights.narrative}</p>
          {insights.highlights.length > 0 && (
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-ui text-eh-ink-2 marker:text-eh-teal">
              {insights.highlights.map((h, i) => (
                <li key={i}>{h}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
