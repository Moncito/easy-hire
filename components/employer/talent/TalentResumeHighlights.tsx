"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/employer/system";
import { useEmployerShell } from "@/components/employer/EmployerShellContext";
import { useEasyAi } from "@/components/employer/pro/useEasyAi";

type Props = { seekerId: string };

type HighlightsResult = { summary: string; highlights: string[] };

/**
 * Pro-only Easy AI resume highlights on a talent profile. Teal like every
 * other Easy AI surface, so AI help reads as help, not a warning.
 */
export default function TalentResumeHighlights({ seekerId }: Props) {
  const { isPro } = useEmployerShell();
  const { run, isLoading } = useEasyAi();
  const [data, setData] = useState<HighlightsResult | null>(null);

  if (!isPro) return null;

  const loading = isLoading("resume-highlights");

  async function handleGenerate() {
    const result = await run<HighlightsResult>("resume-highlights", { seekerId });
    if (result?.configured && result.data) setData(result.data);
  }

  return (
    <section
      aria-labelledby="talent-ai-highlights"
      className="rounded-card border border-[color-mix(in_srgb,var(--eh-teal)_22%,transparent)] bg-eh-teal-tint p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2
          id="talent-ai-highlights"
          className="flex items-center gap-2 font-heading text-[17px] font-semibold tracking-[-0.01em] text-eh-ink"
        >
          <Sparkles className="h-4 w-4 text-eh-teal" aria-hidden="true" />
          Easy AI highlights
        </h2>
        <Button size="sm" icon={<Sparkles />} loading={loading} onClick={() => void handleGenerate()}>
          {loading ? "Reading…" : data ? "Refresh" : "Extract highlights"}
        </Button>
      </div>
      {data ? (
        <div className="mt-3">
          <p className="text-body text-eh-ink-2">{data.summary}</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-ui text-eh-ink-2 marker:text-eh-teal">
            {data.highlights.map((h, i) => (
              <li key={i}>{h}</li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="mt-2 text-ui text-eh-ink-2">
          Generate a skimmable summary of this candidate&apos;s profile for faster shortlisting.
        </p>
      )}
    </section>
  );
}
