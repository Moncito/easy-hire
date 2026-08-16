"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import EasyAiChip from "@/components/employer/pro/EasyAiChip";
import { useEasyAi } from "@/components/employer/pro/useEasyAi";

type InsightsResult = { narrative: string; highlights: string[] };

/**
 * Live Easy AI hiring narrative for the Pro dashboard hero. Fetches once on
 * mount (silently — a config/rate-limit hiccup just falls back to the
 * deterministic `insights.actionRequired`/`marketInsight` copy the Free
 * hero also uses, so the hero never looks broken while AI is unset up).
 */
export default function EasyAiInsightBox({ fallback }: { fallback: string | null }) {
  const { run, isLoading } = useEasyAi();
  const [narrative, setNarrative] = useState<string | null>(null);
  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const result = await run<InsightsResult>("insights", {}, { silent: true });
      if (!active) return;
      setFetched(true);
      if (result?.configured && result.data?.narrative) {
        setNarrative(result.data.narrative);
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const text =
    narrative ??
    (isLoading("insights") && !fetched
      ? "Thinking about your hiring health…"
      : fallback ?? "Easy AI will summarize your hiring health here once it's live — check back soon.");

  return (
    <div className="neo-inset-sm mt-5 flex items-start gap-3 rounded-xl px-4 py-3">
      <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--neo-gold)]" strokeWidth={2.25} />
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-wider text-[color:var(--neo-gold)]">
          Easy AI insight
        </p>
        <p className="mt-1 text-xs leading-relaxed text-[color:var(--neo-muted)]">{text}</p>
      </div>
      <EasyAiChip variant="inline" label="Open Easy AI" className="shrink-0" />
    </div>
  );
}
