"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { useEmployerShell } from "@/components/employer/EmployerShellContext";
import { useEasyAi } from "@/components/employer/pro/useEasyAi";
import NeoSurface from "@/components/employer/pro/NeoSurface";
import NeoButton from "@/components/employer/pro/NeoButton";

type Props = { seekerId: string };

type HighlightsResult = { summary: string; highlights: string[] };

/** Pro-only resume highlight strip for talent profiles. */
export default function TalentResumeHighlights({ seekerId }: Props) {
  const { isPro } = useEmployerShell();
  const { run, isLoading } = useEasyAi();
  const [data, setData] = useState<HighlightsResult | null>(null);

  if (!isPro) return null;

  async function handleGenerate() {
    const result = await run<HighlightsResult>("resume-highlights", { seekerId });
    if (result?.configured && result.data) setData(result.data);
  }

  return (
    <NeoSurface variant="raised" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[color:var(--neo-gold)]">
          <Sparkles className="h-3.5 w-3.5" strokeWidth={2.25} />
          Easy AI highlights
        </p>
        <NeoButton
          variant="secondary"
          size="sm"
          onClick={handleGenerate}
          disabled={isLoading("resume-highlights")}
        >
          {isLoading("resume-highlights") ? "Reading…" : data ? "Refresh" : "Extract highlights"}
        </NeoButton>
      </div>
      {data ? (
        <>
          <p className="text-sm leading-relaxed text-[color:var(--neo-ink)]">{data.summary}</p>
          <ul className="space-y-1.5">
            {data.highlights.map((h, i) => (
              <li key={i} className="text-xs leading-relaxed text-[color:var(--neo-muted)]">
                • {h}
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="text-xs leading-relaxed text-[color:var(--neo-muted)]">
          Generate a skimmable summary of this candidate&apos;s profile for faster shortlisting.
        </p>
      )}
    </NeoSurface>
  );
}
