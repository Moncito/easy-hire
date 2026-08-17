"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Copy, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useEmployerShell } from "@/components/employer/EmployerShellContext";
import { useEasyAi } from "@/components/employer/pro/useEasyAi";

type RankResult = { score: number; reasons: string[]; summary: string };
type DraftResult = { body: string };
type InterviewResult = { questions: string[] };

const ALL_TONES = [
  { value: "first_outreach", label: "First outreach" },
  { value: "follow_up", label: "Follow-up" },
  { value: "interview_invite", label: "Interview invite" },
  { value: "rejection", label: "Rejection" },
  { value: "welcome", label: "Welcome / next steps" },
] as const;

type Tone = (typeof ALL_TONES)[number]["value"];

type Props = { applicationId: string; status: string };

function tonesForStatus(status: string): readonly (typeof ALL_TONES)[number][] {
  if (status === "HIRED") {
    return ALL_TONES.filter((t) => t.value === "welcome");
  }
  if (status === "REJECTED") {
    return ALL_TONES.filter((t) => t.value === "rejection");
  }
  if (status === "INTERVIEW") {
    return ALL_TONES.filter((t) =>
      ["interview_invite", "follow_up", "rejection"].includes(t.value)
    );
  }
  if (status === "SHORTLISTED") {
    return ALL_TONES.filter((t) => t.value !== "welcome");
  }
  return ALL_TONES.filter((t) =>
    ["first_outreach", "follow_up", "rejection"].includes(t.value)
  );
}

function defaultTone(status: string): Tone {
  if (status === "HIRED") return "welcome";
  if (status === "REJECTED") return "rejection";
  if (status === "INTERVIEW") return "interview_invite";
  return "first_outreach";
}

function SecondaryButton({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex w-full items-center justify-center rounded-full border border-ink/10 bg-white px-4 py-2 text-xs font-semibold text-ink transition hover:border-ink/15 hover:bg-ink/[0.02] disabled:cursor-not-allowed disabled:opacity-50"
    >
      {children}
    </button>
  );
}

/** Employer Pro candidate-detail panel: one stage-aware assist, not three
 * equal generators. Scoring never changes Application.status and drafts
 * never send on their own. */
export default function CandidateEasyAiPanel({ applicationId, status }: Props) {
  const { isPro } = useEmployerShell();
  const { run, isLoading } = useEasyAi();
  const [rank, setRank] = useState<RankResult | null>(null);
  const [tone, setTone] = useState<Tone>(() => defaultTone(status));
  const [draft, setDraft] = useState("");
  const [interview, setInterview] = useState<string[] | null>(null);

  const tones = useMemo(() => tonesForStatus(status), [status]);
  const showRank = status === "APPLIED" || status === "SHORTLISTED";
  const showInterview = status === "SHORTLISTED" || status === "INTERVIEW";
  const assistSuffix =
    status === "HIRED"
      ? "Next steps"
      : status === "REJECTED"
        ? "Rejection draft"
        : status === "INTERVIEW"
          ? "Interview kit"
          : null;

  useEffect(() => {
    const next = defaultTone(status);
    setTone((current) => (tones.some((t) => t.value === current) ? current : next));
    setDraft("");
  }, [status, tones]);

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
    <section className="pro-card space-y-3 p-4">
      <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#9A5B12]">
        <Sparkles className="h-3.5 w-3.5" strokeWidth={2.25} />
        Easy AI{assistSuffix ? ` · ${assistSuffix}` : ""}
      </div>

      {showRank && (
        <div>
          {rank ? (
            <div className="rounded-xl bg-mist/80 p-3 ring-1 ring-ink/5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-ink">Match score</span>
                <span className="font-data text-lg font-bold text-ink">
                  {rank.score}
                  <span className="text-xs font-semibold text-ink/40">/100</span>
                </span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-ink/55">{rank.summary}</p>
              <ul className="mt-2 space-y-1">
                {rank.reasons.map((reason, i) => (
                  <li key={i} className="text-xs leading-relaxed text-ink/55">
                    • {reason}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={handleRank}
                disabled={isLoading("rank")}
                className="mt-2 text-xs font-semibold text-[#9A5B12] hover:underline disabled:opacity-60"
              >
                {isLoading("rank") ? "Re-scoring…" : "Re-score"}
              </button>
            </div>
          ) : (
            <SecondaryButton onClick={handleRank} disabled={isLoading("rank")}>
              {isLoading("rank") ? "Scoring…" : "Rank this candidate"}
            </SecondaryButton>
          )}
        </div>
      )}

      {showInterview && (
        <div className={showRank ? "border-t border-ink/6 pt-3" : ""}>
          {status !== "INTERVIEW" && (
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-ink/45">
              Interview kit
            </p>
          )}
          <SecondaryButton onClick={handleInterview} disabled={isLoading("interview")}>
            {isLoading("interview") ? "Generating…" : interview ? "Refresh questions" : "Generate questions"}
          </SecondaryButton>
          {interview && interview.length > 0 && (
            <ol className="mt-2 list-decimal space-y-1.5 rounded-xl bg-mist/80 p-3 pl-7 ring-1 ring-ink/5">
              {interview.map((q, i) => (
                <li key={i} className="text-xs leading-relaxed text-ink">
                  {q}
                </li>
              ))}
            </ol>
          )}
        </div>
      )}

      <div className={showRank || showInterview ? "border-t border-ink/6 pt-3" : ""}>
        {(showRank || showInterview) && (
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-ink/45">
            Draft outreach
          </p>
        )}
        {tones.length > 1 && (
          <div className="flex flex-wrap gap-1.5">
            {tones.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setTone(t.value)}
                className={`rounded-full px-2.5 py-1 text-xs font-semibold transition ${
                  tone === t.value
                    ? "bg-marigold/15 text-ink ring-1 ring-marigold/30"
                    : "text-ink/50 hover:text-ink"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}
        <div className={tones.length > 1 ? "mt-2" : ""}>
          <SecondaryButton onClick={handleDraft} disabled={isLoading("message-draft")}>
            {isLoading("message-draft")
              ? "Drafting…"
              : status === "HIRED"
                ? "Draft welcome"
                : status === "REJECTED"
                  ? "Draft rejection"
                  : "Draft with Easy AI"}
          </SecondaryButton>
        </div>
        {draft && (
          <div className="mt-2 rounded-xl bg-mist/80 p-3 ring-1 ring-ink/5">
            <p className="whitespace-pre-wrap text-xs leading-relaxed text-ink">{draft}</p>
            <button
              type="button"
              onClick={copyDraft}
              className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#9A5B12] hover:underline"
            >
              <Copy className="h-3 w-3" strokeWidth={2.25} />
              Copy draft
            </button>
          </div>
        )}
      </div>

      <p className="text-xs leading-relaxed text-ink/40">
        Suggestions only — nothing sends, rejects, or changes stage without you.
      </p>
    </section>
  );
}
