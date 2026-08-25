"use client";

import { FormEvent, useMemo, useState } from "react";
import { CheckCircle2, ChevronDown, ClipboardCheck, LockKeyhole, Save } from "lucide-react";

type Props = {
  companyId: string;
  jobId: string;
  applicationId: string;
  canScore: boolean;
  template: { id: string; title: string; instructions: string | null; criteria: Array<{ id: string; label: string; description: string | null }> } | null;
  ownEvaluation: { submittedAt: string | null; summary: string | null; recommendation: string | null; ratings: Array<{ criterionId: string; score: number }> } | null;
  submittedReviews: Array<{ id: string; recommendation: string | null; summary: string | null; submittedAt: string | null; member: { user: { email: string } }; ratings: Array<{ criterion: { label: string }; score: number }> }>;
  feedbackLocked?: boolean;
};

const recommendations = [["STRONG_NO", "Strong no"], ["NO", "No"], ["YES", "Yes"], ["STRONG_YES", "Strong yes"]] as const;
function label(value: string | null) { return recommendations.find(([key]) => key === value)?.[1] ?? "No recommendation"; }

export default function CollaboratorScorecard({ companyId, jobId, applicationId, canScore, template, ownEvaluation, submittedReviews, feedbackLocked = false }: Props) {
  const initialScores = useMemo(() => Object.fromEntries(ownEvaluation?.ratings.map((rating) => [rating.criterionId, rating.score]) ?? []), [ownEvaluation]);
  const [scores, setScores] = useState<Record<string, number>>(initialScores);
  const [summary, setSummary] = useState(ownEvaluation?.summary ?? "");
  const [recommendation, setRecommendation] = useState(ownEvaluation?.recommendation ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const submitted = Boolean(ownEvaluation?.submittedAt);

  async function save(event: FormEvent, submit: boolean) {
    event.preventDefault();
    if (!template || submitted) return;
    setSaving(true); setMessage("");
    const response = await fetch(`/api/hiring/${companyId}/jobs/${jobId}/applications/${applicationId}/scorecard`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ scores: Object.entries(scores).map(([criterionId, score]) => ({ criterionId, score })), summary: summary || null, recommendation: recommendation || null, submit }) });
    const result = await response.json();
    setSaving(false);
    if (!response.ok) return setMessage(result.error || "Could not save the scorecard.");
    if (submit) window.location.reload(); else setMessage("Draft saved. Only you can see it until you submit.");
  }

  if (!template) return <section className="border-y border-ink/[0.07] py-6"><div className="flex items-start gap-3"><ClipboardCheck className="mt-0.5 h-5 w-5 text-ink/40" /><div><h2 className="font-display text-xl font-bold text-ink">Scorecard not ready</h2><p className="mt-1 text-sm text-ink/55">This role needs a scorecard before the team can submit feedback.</p></div></div></section>;

  return <section className="border-y border-ink/[0.07] py-5"><div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#9A5B12]">Your evaluation</p><h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink">{template.title}</h2>{template.instructions && <p className="mt-2 text-sm text-ink/55">{template.instructions}</p>}</div>{submitted && <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-teal/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.11em] text-teal"><CheckCircle2 className="h-3.5 w-3.5" />Submitted</span>}</div>{feedbackLocked && <p className="mt-3 text-sm text-ink/55">Submit your scorecard to unlock other reviewers’ feedback.</p>}{submitted ? <div className="mt-5 space-y-3"><p className="text-sm text-ink/60">Your feedback is submitted and cannot be edited.</p><div className="grid gap-2 sm:grid-cols-2">{template.criteria.map((criterion) => <div key={criterion.id} className="flex items-center justify-between bg-white/60 px-3 py-2"><span className="text-sm text-ink/65">{criterion.label}</span><span className="font-data text-lg font-bold text-ink">{initialScores[criterion.id] ?? "–"}/5</span></div>)}</div><p className="text-sm font-semibold text-ink">{label(ownEvaluation?.recommendation ?? null)}</p>{ownEvaluation?.summary && <p className="whitespace-pre-wrap text-sm leading-6 text-ink/60">{ownEvaluation.summary}</p>}</div> : !canScore ? <div className="mt-5 flex items-start gap-3 bg-ink/[0.035] px-4 py-3"><LockKeyhole className="mt-0.5 h-4 w-4 text-ink/45" /><p className="text-sm text-ink/60">Your role can view feedback but cannot submit an evaluation.</p></div> : <form className="mt-5 space-y-5" onSubmit={(event) => save(event, false)}>{template.criteria.map((criterion) => <fieldset key={criterion.id}><legend className="text-sm font-semibold text-ink">{criterion.label}</legend>{criterion.description && <p className="mt-1 text-xs text-ink/50">{criterion.description}</p>}<div className="mt-2 flex gap-2">{[1, 2, 3, 4, 5].map((score) => <button key={score} type="button" onClick={() => setScores((current) => ({ ...current, [criterion.id]: score }))} className={`h-9 w-9 rounded-lg text-sm font-bold transition ${scores[criterion.id] === score ? "bg-teal text-white" : "bg-ink/[0.05] text-ink/55 hover:bg-teal/10 hover:text-teal"}`}>{score}</button>)}</div></fieldset>)}<label className="block text-sm font-semibold text-ink">Overall recommendation<div className="relative mt-2"><select value={recommendation} onChange={(event) => setRecommendation(event.target.value)} className="w-full appearance-none rounded-xl border border-ink/12 bg-white px-3.5 py-2.5 text-sm font-medium text-ink outline-none focus:border-teal"><option value="">Choose a recommendation</option>{recommendations.map(([value, name]) => <option key={value} value={value}>{name}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-ink/40" /></div></label><label className="block text-sm font-semibold text-ink">Private feedback <span className="font-normal text-ink/45">until you submit</span><textarea value={summary} onChange={(event) => setSummary(event.target.value)} maxLength={3000} rows={5} placeholder="Summarize the evidence behind your recommendation…" className="mt-2 w-full resize-y rounded-xl border border-ink/12 bg-white px-3.5 py-3 text-sm font-normal leading-6 outline-none focus:border-teal focus:ring-4 focus:ring-teal/10" /></label><div className="flex flex-wrap items-center gap-3"><button disabled={saving} className="inline-flex items-center gap-2 rounded-xl border border-ink/12 bg-white px-4 py-2.5 text-sm font-bold text-ink transition hover:border-teal/30 disabled:opacity-60"><Save className="h-4 w-4" />Save draft</button><button type="button" disabled={saving} onClick={(event) => save(event, true)} className="inline-flex items-center gap-2 rounded-xl bg-marigold px-4 py-2.5 text-sm font-bold text-ink transition hover:bg-marigold/90 disabled:opacity-60"><CheckCircle2 className="h-4 w-4" />Submit scorecard</button>{message && <p role="alert" className="text-sm text-ember">{message}</p>}</div></form>}<SubmittedReviews reviews={submittedReviews} ownRecommendation={submitted ? ownEvaluation?.recommendation ?? null : null} /></section>;
}

function SubmittedReviews({ reviews, ownRecommendation }: { reviews: Props["submittedReviews"]; ownRecommendation: string | null }) {
  if (!reviews.length && !ownRecommendation) return null;
  const votes = reviews.map((review) => review.recommendation).filter(Boolean);
  const yesVotes = votes.filter((vote) => vote === "YES" || vote === "STRONG_YES").length + (ownRecommendation === "YES" || ownRecommendation === "STRONG_YES" ? 1 : 0);
  const totalVotes = votes.length + (ownRecommendation ? 1 : 0);
  return <div className="mt-7 border-t border-ink/[0.07] pt-5"><div className="flex items-center justify-between gap-3"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink/45">Submitted team feedback</p><p className="text-xs font-semibold text-teal">{totalVotes} submitted · {yesVotes} positive</p></div><div className="mt-3 space-y-3">{reviews.map((review) => <article key={review.id} className="bg-white/60 px-4 py-3"><div className="flex items-center justify-between gap-3"><p className="text-sm font-semibold text-ink">{review.member.user.email}</p><span className="text-xs font-bold text-teal">{label(review.recommendation)}</span></div>{review.summary && <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-ink/60">{review.summary}</p>}</article>)}</div></div>;
}
