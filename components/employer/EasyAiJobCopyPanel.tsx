"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { useEmployerShell } from "@/components/employer/EmployerShellContext";
import { useEasyAi } from "@/components/employer/pro/useEasyAi";
import ProButton from "@/components/employer/pro/ProButton";

type JobCopyResult = {
  title: string;
  description: string;
  requirements: string;
  benefits: string;
};

type Props = {
  title: string;
  category: string;
  industry: string;
  employmentType: string;
  remoteType: string;
  location: string;
  description: string;
  requirements: string;
  benefits: string;
  onApply: (result: JobCopyResult) => void;
};

/** Employer Pro job-form panel: drafts or rewrites title/description/
 * requirements/benefits from the fields already filled in. Free employers
 * never see this — the rest of JobForm stays identical for both plans. */
export default function EasyAiJobCopyPanel({
  title,
  category,
  industry,
  employmentType,
  remoteType,
  location,
  description,
  requirements,
  benefits,
  onApply,
}: Props) {
  const { isPro } = useEmployerShell();
  const { run, isLoading } = useEasyAi();
  const [notes, setNotes] = useState("");

  if (!isPro) return null;

  const hasDraft = description.trim().length > 0;
  const canGenerate = title.trim().length > 0;

  async function handleGenerate() {
    if (!canGenerate) return;
    const result = await run<JobCopyResult>("job-copy", {
      mode: hasDraft ? "improve" : "draft",
      title,
      category: category || undefined,
      industry: industry || undefined,
      employmentType: employmentType || undefined,
      remoteType: remoteType || undefined,
      location: location || undefined,
      existingDescription: description || undefined,
      existingRequirements: requirements || undefined,
      existingBenefits: benefits || undefined,
      notes: notes || undefined,
    });
    if (result?.configured && result.data) {
      onApply(result.data);
    }
  }

  return (
    <div className="pro-card mb-5 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-marigold/15 text-[#9A5B12]">
            <Sparkles className="h-4 w-4" strokeWidth={2.25} />
          </span>
          <div>
            <p className="text-sm font-bold text-ink">Improve with Easy AI</p>
            <p className="mt-0.5 text-xs leading-relaxed text-ink/50">
              {hasDraft
                ? "Rewrite the title, description, requirements and benefits from what's filled in below."
                : "Draft the title, description, requirements and benefits from the role details below."}
            </p>
          </div>
        </div>
        <ProButton
          variant="secondary"
          onClick={handleGenerate}
          disabled={!canGenerate || isLoading("job-copy")}
        >
          {isLoading("job-copy") ? "Writing…" : hasDraft ? "Rewrite with Easy AI" : "Draft with Easy AI"}
        </ProButton>
      </div>
      <div className="mt-3">
        <label htmlFor="easy-ai-job-notes" className="sr-only">
          Notes for Easy AI
        </label>
        <input
          id="easy-ai-job-notes"
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional notes for Easy AI — tools used, tone, must-haves…"
          className="w-full rounded-xl border border-ink/10 bg-white px-3.5 py-2.5 text-sm text-ink outline-none placeholder:text-ink/40 focus:border-ink/25"
        />
      </div>
      {!canGenerate && (
        <p className="mt-2 text-[11px] text-ink/45">Add a job title first.</p>
      )}
    </div>
  );
}
