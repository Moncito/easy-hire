"use client";

import { useState } from "react";
import { Copy, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useEmployerShell } from "@/components/employer/EmployerShellContext";
import { useEasyAi } from "@/components/employer/pro/useEasyAi";
import NeoSurface from "@/components/employer/pro/NeoSurface";
import NeoButton from "@/components/employer/pro/NeoButton";

type RankResult = { score: number; reasons: string[]; summary: string };
type DraftResult = { body: string };
type InterviewResult = { questions: string[] };

const TONES = [
  { value: "first_outreach", label: "First outreach" },
  { value: "follow_up", label: "Follow-up" },
  { value: "interview_invite", label: "Interview invite" },
  { value: "rejection", label: "Rejection" },
] as const;

type Tone = (typeof TONES)[number]["value"];

type Props = { applicationId: string };

/** Employer Pro candidate-detail panel: advisory match score, interview kit,
 * and a reviewable outreach draft. Scoring never changes Application.status
 * and drafts never send on their own. */
export default function CandidateEasyAiPanel({ applicationId }: Props) {
  const { isPro } = useEmployerShell();
  const { run, isLoading } = useEasyAi();
  const [rank, setRank] = useState<RankResult | null>(null);
  const [tone, setTone] = useState<Tone>("first_outreach");
  const [draft, setDraft] = useState("");
  const [interview, setInterview] = useState<string[] | null>(null);

  if (!isPro) return null;

  async function handleRank() {
    const result = await run<RankResult>("rank", { applicationId });
    if (result?.configured && result.data) setRank(result.data);
  }

  async function handleDraft() {
    const result = await run<DraftResult>("message-draft", { applicationId, tone });
    if (result?.configured && result.data) setDraft(result.data.body);
  }

  async function handleInterview() {
    const result = await run<InterviewResult>("interview", { applicationId });
    if (result?.configured && result.data) setInterview(result.data.questions);
  }

  async function copyDraft() {
    try {
      await navigator.clipboard.writeText(draft);
      toast.success("Draft copied — paste it into your reply.");
    } catch {
      toast.error("Couldn't copy — select and copy the text manually.");
    }
  }

  return (
    <NeoSurface variant="raised" className="space-y-3">
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[color:var(--neo-gold)]">
        <Sparkles className="h-3.5 w-3.5" strokeWidth={2.25} />
        Easy AI
      </div>

      <div>
        {rank ? (
          <div className="neo-inset-sm rounded-xl p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-[color:var(--neo-ink)]">Match score</span>
              <span className="font-data text-lg font-bold text-[color:var(--neo-teal)]">
                {rank.score}
                <span className="text-[10px] font-semibold text-[color:var(--neo-muted)]">/100</span>
              </span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-[color:var(--neo-muted)]">{rank.summary}</p>
            <ul className="mt-2 space-y-1">
              {rank.reasons.map((reason, i) => (
                <li key={i} className="text-[11px] leading-relaxed text-[color:var(--neo-muted)]">
                  • {reason}
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={handleRank}
              disabled={isLoading("rank")}
              className="mt-2 text-[11px] font-semibold text-[color:var(--neo-teal)] hover:underline disabled:opacity-60"
            >
              {isLoading("rank") ? "Re-scoring…" : "Re-score"}
            </button>
          </div>
        ) : (
          <NeoButton
            variant="secondary"
            size="sm"
            onClick={handleRank}
            disabled={isLoading("rank")}
            className="w-full"
          >
            {isLoading("rank") ? "Scoring…" : "Rank this candidate"}
          </NeoButton>
        )}
      </div>

      <div className="border-t border-[color:var(--neo-ink)]/[0.06] pt-3">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[color:var(--neo-muted)]">
          Interview kit
        </p>
        <NeoButton
          variant="secondary"
          size="sm"
          className="w-full"
          onClick={handleInterview}
          disabled={isLoading("interview")}
        >
          {isLoading("interview") ? "Generating…" : interview ? "Refresh questions" : "Generate questions"}
        </NeoButton>
        {interview && interview.length > 0 && (
          <ol className="neo-inset-sm mt-2 list-decimal space-y-1.5 rounded-xl p-3 pl-7">
            {interview.map((q, i) => (
              <li key={i} className="text-[11px] leading-relaxed text-[color:var(--neo-ink)]">
                {q}
              </li>
            ))}
          </ol>
        )}
      </div>

      <div className="border-t border-[color:var(--neo-ink)]/[0.06] pt-3">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[color:var(--neo-muted)]">
          Draft outreach
        </p>
        <div className="flex flex-wrap gap-1.5">
          {TONES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setTone(t.value)}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                tone === t.value
                  ? "neo-inset-sm text-[color:var(--neo-teal)]"
                  : "text-[color:var(--neo-muted)] hover:text-[color:var(--neo-ink)]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <NeoButton
          variant="secondary"
          size="sm"
          className="mt-2 w-full"
          onClick={handleDraft}
          disabled={isLoading("message-draft")}
        >
          {isLoading("message-draft") ? "Drafting…" : "Draft with Easy AI"}
        </NeoButton>
        {draft && (
          <div className="neo-inset-sm mt-2 rounded-xl p-3">
            <p className="whitespace-pre-wrap text-xs leading-relaxed text-[color:var(--neo-ink)]">{draft}</p>
            <button
              type="button"
              onClick={copyDraft}
              className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-[color:var(--neo-teal)] hover:underline"
            >
              <Copy className="h-3 w-3" strokeWidth={2.25} />
              Copy draft
            </button>
          </div>
        )}
      </div>

      <p className="text-[10px] leading-relaxed text-[color:var(--neo-muted)]">
        Suggestions only — nothing sends, rejects, or changes stage without you.
      </p>
    </NeoSurface>
  );
}
