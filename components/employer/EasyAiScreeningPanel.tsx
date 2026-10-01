"use client";

import { useState } from "react";
import { ListChecks, Sparkles } from "lucide-react";
import { useEmployerShell } from "@/components/employer/EmployerShellContext";
import { useEasyAi } from "@/components/employer/pro/useEasyAi";
import { Button, StatusBadge } from "@/components/employer/system";

type ScreeningQuestion = { prompt: string; required: boolean };

type Props = {
  title: string;
  description: string;
  requirements: string;
  onApply: (questions: ScreeningQuestion[]) => void;
};

/** Suggests screening questions for the job form — employer still edits before save. */
export default function EasyAiScreeningPanel({ title, description, requirements, onApply }: Props) {
  const { isPro } = useEmployerShell();
  const { run, isLoading } = useEasyAi();
  const [preview, setPreview] = useState<ScreeningQuestion[] | null>(null);

  if (!isPro) return null;

  async function handleSuggest() {
    if (!title.trim() || !description.trim()) return;
    const result = await run<{ questions: ScreeningQuestion[] }>("screening-questions", {
      title,
      description,
      requirements: requirements || null,
    });
    if (result?.configured && result.data?.questions) {
      setPreview(result.data.questions);
    }
  }

  const loading = isLoading("screening-questions");
  const ready = Boolean(title.trim() && description.trim());

  return (
    <div className="rounded-control border border-[color-mix(in_srgb,var(--eh-teal)_22%,transparent)] bg-eh-teal-tint p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="inline-flex items-center gap-2 text-ui font-semibold text-eh-ink">
          <Sparkles className="h-4 w-4 text-eh-teal" aria-hidden="true" />
          Easy AI screening
        </p>
        <Button size="sm" icon={<ListChecks />} loading={loading} disabled={!ready} onClick={() => void handleSuggest()}>
          {loading ? "Suggesting…" : "Suggest questions"}
        </Button>
      </div>
      {!ready && <p className="mt-1.5 text-small text-eh-ink-2">Add a title and description first.</p>}
      {preview && preview.length > 0 && (
        <div className="mt-3 rounded-control border border-eh-line bg-eh-surface p-3">
          <ul className="space-y-1.5">
            {preview.map((q, i) => (
              <li key={i} className="flex flex-wrap items-center gap-2 text-ui text-eh-ink-2">
                <span className="min-w-0 flex-1">{q.prompt}</span>
                {q.required && <StatusBadge tone="neutral">Required</StatusBadge>}
              </li>
            ))}
          </ul>
          <Button
            size="sm"
            variant="primary"
            className="mt-3"
            onClick={() => {
              onApply(preview);
              setPreview(null);
            }}
          >
            Add suggested questions
          </Button>
        </div>
      )}
      <p className="mt-2 text-small text-eh-muted">Suggestions only — answers never auto-reject candidates.</p>
    </div>
  );
}