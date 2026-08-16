"use client";

import { useState } from "react";
import { ListChecks, Sparkles } from "lucide-react";
import { useEmployerShell } from "@/components/employer/EmployerShellContext";
import { useEasyAi } from "@/components/employer/pro/useEasyAi";
import NeoButton from "@/components/employer/pro/NeoButton";

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

  return (
    <div className="rounded-xl border border-[color:var(--neo-gold)]/20 bg-[color:var(--neo-gold)]/[0.04] p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[color:var(--neo-gold)]">
          <Sparkles className="h-3.5 w-3.5" strokeWidth={2.25} />
          Easy AI screening
        </p>
        <NeoButton
          variant="secondary"
          size="sm"
          onClick={handleSuggest}
          disabled={isLoading("screening-questions") || !title.trim() || !description.trim()}
          icon={<ListChecks className="h-3.5 w-3.5" strokeWidth={2.25} />}
        >
          {isLoading("screening-questions") ? "Suggesting…" : "Suggest questions"}
        </NeoButton>
      </div>
      {preview && preview.length > 0 && (
        <div className="mt-3 space-y-2">
          <ul className="space-y-1.5">
            {preview.map((q, i) => (
              <li key={i} className="text-xs leading-relaxed text-[color:var(--neo-muted)]">
                • {q.prompt}
                {q.required ? (
                  <span className="ml-1 text-[10px] font-semibold text-[color:var(--neo-teal)]">Required</span>
                ) : null}
              </li>
            ))}
          </ul>
          <NeoButton
            variant="primary"
            size="sm"
            onClick={() => {
              onApply(preview);
              setPreview(null);
            }}
          >
            Add suggested questions
          </NeoButton>
        </div>
      )}
      <p className="mt-2 text-[10px] leading-relaxed text-[color:var(--neo-muted)]">
        Suggestions only — answers never auto-reject candidates.
      </p>
    </div>
  );
}
