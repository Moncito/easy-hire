"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { useEmployerShell } from "@/components/employer/EmployerShellContext";
import { useEasyAi } from "@/components/employer/pro/useEasyAi";
import { Button } from "@/components/employer/system";

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

  const loading = isLoading("job-copy");

  return (
    <section
      aria-labelledby="easy-ai-job-copy"
      className="mb-6 rounded-card border border-[color-mix(in_srgb,var(--eh-teal)_22%,transparent)] bg-eh-teal-tint p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-control bg-eh-teal text-white" aria-hidden="true">
            <Sparkles className="h-[18px] w-[18px]" />
          </span>
          <div>
            <h2 id="easy-ai-job-copy" className="font-heading text-[18px] font-semibold tracking-[-0.01em] text-eh-ink">
              {hasDraft ? "Improve with Easy AI" : "Draft with Easy AI"}
            </h2>
            <p className="mt-0.5 text-ui text-eh-ink-2">
              {hasDraft
                ? "Rewrite the title, description, requirements and benefits from what's filled in below."
                : "Draft the title, description, requirements and benefits from the role details below."}
            </p>
          </div>
        </div>
        <Button icon={<Sparkles />} loading={loading} disabled={!canGenerate} onClick={() => void handleGenerate()}>
          {loading ? "Writing…" : hasDraft ? "Rewrite with Easy AI" : "Draft with Easy AI"}
        </Button>
      </div>
      <div className="mt-4">
        <label htmlFor="easy-ai-job-notes" className="sr-only">
          Notes for Easy AI
        </label>
        <input
          id="easy-ai-job-notes"
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional notes for Easy AI — tools used, tone, must-haves…"
          className="h-10 w-full rounded-control border border-eh-line bg-eh-surface px-3 text-ui text-eh-ink outline-none transition-colors duration-150 placeholder:text-eh-muted focus-visible:border-eh-teal"
        />
      </div>
      {!canGenerate && <p className="mt-2 text-small text-eh-ink-2">Add a job title first.</p>}
    </section>
  );
}