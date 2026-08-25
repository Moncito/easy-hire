"use client";

import { useMemo, useState } from "react";
import { Check, ClipboardList, Info, LoaderCircle, Plus, Save, Trash2, UsersRound } from "lucide-react";
import { toast } from "sonner";

type Member = { id: string; email: string; role: string };
type FormErrors = { title?: string; criteria?: string; memberIds?: string };

function roleLabel(role: string) {
  return role.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function HiringSetupForm({ jobId, members, initial }: { jobId: string; members: Member[]; initial: { memberIds: string[]; title: string; instructions: string; criteria: string[] } }) {
  const [memberIds, setMemberIds] = useState(initial.memberIds);
  const [title, setTitle] = useState(initial.title);
  const [instructions, setInstructions] = useState(initial.instructions);
  const [criteria, setCriteria] = useState(initial.criteria);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const nonEmptyCriteria = useMemo(() => criteria.filter((criterion) => criterion.trim()), [criteria]);

  function validate() {
    const next: FormErrors = {};
    if (title.trim().length < 2) next.title = "Give this scorecard a clear name of at least 2 characters.";
    if (nonEmptyCriteria.length === 0) next.criteria = "Add at least one criterion so reviewers know what to assess.";
    if (criteria.some((criterion) => criterion.trim().length > 0 && criterion.trim().length < 2)) next.criteria = "Each criterion needs at least 2 characters.";
    if (criteria.length > 10) next.criteria = "A scorecard can have up to 10 criteria.";
    if (memberIds.length > 30) next.memberIds = "You can assign up to 30 reviewers.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function save() {
    if (!validate()) { toast.error("Review the highlighted fields before saving."); return; }
    setSaving(true);
    try {
      const response = await fetch(`/api/employer/jobs/${jobId}/hiring-setup`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ memberIds, title: title.trim(), instructions: instructions.trim() || null, criteria: nonEmptyCriteria.map((label) => ({ label: label.trim() })) }) });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error || "Could not save the hiring setup.");
      toast.success("Hiring setup saved", { description: "Your review team and scorecard are ready to use." });
    } catch (error) {
      toast.error("Couldn’t save hiring setup", { description: error instanceof Error ? error.message : "Please try again." });
    } finally { setSaving(false); }
  }

  return (
    <form onSubmit={(event) => { event.preventDefault(); void save(); }} className="mt-6 grid gap-5 lg:grid-cols-[minmax(280px,.8fr)_minmax(0,1.2fr)] lg:gap-6">
      <section aria-labelledby="review-team-heading" className="rounded-2xl border border-ink/10 bg-white/80 p-5 shadow-[0_10px_30px_rgba(32,36,43,0.04)] sm:p-6">
        <div className="flex items-start justify-between gap-3"><div><div className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-lg bg-teal/10 text-teal"><UsersRound className="h-4 w-4" /></span><h2 id="review-team-heading" className="font-display text-xl font-bold text-ink">Review team</h2></div><p className="mt-3 text-sm leading-5 text-ink/55">Only assigned teammates can submit a review for this role.</p></div><span className="shrink-0 rounded-full bg-teal/10 px-2.5 py-1 text-xs font-bold text-teal">{memberIds.length} selected</span></div>
        <div className="mt-5 space-y-2" aria-describedby={errors.memberIds ? "review-team-error" : undefined}>{members.map((member) => { const selected = memberIds.includes(member.id); return <label key={member.id} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors ${selected ? "border-teal/35 bg-teal/[0.06]" : "border-ink/10 bg-white hover:border-ink/20 hover:bg-mist/60"}`}><input type="checkbox" checked={selected} onChange={() => { setMemberIds((current) => current.includes(member.id) ? current.filter((id) => id !== member.id) : [...current, member.id]); setErrors((current) => ({ ...current, memberIds: undefined })); }} className="peer sr-only" /><span className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border transition-colors ${selected ? "border-teal bg-teal text-white" : "border-ink/30 bg-white"}`}><Check className={`h-3.5 w-3.5 ${selected ? "opacity-100" : "opacity-0"}`} /></span><span className="min-w-0"><span className="block truncate text-sm font-semibold text-ink">{member.email}</span><span className="mt-0.5 block text-[11px] font-bold uppercase tracking-wide text-ink/45">{roleLabel(member.role)}</span></span></label>; })}</div>
        {errors.memberIds && <p id="review-team-error" className="mt-3 text-sm font-medium text-ember" role="alert">{errors.memberIds}</p>}
      </section>
      <section aria-labelledby="scorecard-heading" className="rounded-2xl border border-ink/10 bg-white/80 p-5 shadow-[0_10px_30px_rgba(32,36,43,0.04)] sm:p-6">
        <div className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-lg bg-marigold/20 text-[#9A5B12]"><ClipboardList className="h-4 w-4" /></span><h2 id="scorecard-heading" className="font-display text-xl font-bold text-ink">Scorecard</h2></div><p className="mt-3 text-sm leading-5 text-ink/55">Create a shared, consistent rubric for every reviewer.</p>
        <div className="mt-5"><label htmlFor="scorecard-title" className="text-sm font-semibold text-ink">Scorecard name</label><input id="scorecard-title" value={title} onChange={(event) => { setTitle(event.target.value); setErrors((current) => ({ ...current, title: undefined })); }} maxLength={80} aria-invalid={!!errors.title} aria-describedby={errors.title ? "scorecard-title-error" : "scorecard-title-help"} className={`mt-2 w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition focus:border-teal focus:ring-3 focus:ring-teal/10 ${errors.title ? "border-ember" : "border-ink/15"}`} /><div className="mt-1.5 flex justify-between gap-3"><span id="scorecard-title-help" className="text-xs text-ink/45">Keep it specific to this role.</span><span className="text-xs tabular-nums text-ink/40">{title.length}/80</span></div>{errors.title && <p id="scorecard-title-error" className="mt-1.5 text-sm font-medium text-ember" role="alert">{errors.title}</p>}</div>
        <div className="mt-5"><div className="flex items-center justify-between gap-3"><label className="text-sm font-semibold text-ink">Evaluation criteria</label><span className="text-xs font-medium text-ink/45">{nonEmptyCriteria.length}/10</span></div><div className="mt-2 space-y-2">{criteria.map((criterion, index) => <div key={index} className="flex items-center gap-2"><input value={criterion} onChange={(event) => { setCriteria((current) => current.map((value, itemIndex) => itemIndex === index ? event.target.value : value)); setErrors((current) => ({ ...current, criteria: undefined })); }} maxLength={80} placeholder={`Criterion ${index + 1}`} aria-label={`Criterion ${index + 1}`} className={`min-w-0 flex-1 rounded-xl border bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-ink/35 focus:border-teal focus:ring-3 focus:ring-teal/10 ${errors.criteria ? "border-ember" : "border-ink/15"}`} /><button type="button" onClick={() => { setCriteria((current) => current.filter((_, itemIndex) => itemIndex !== index)); setErrors((current) => ({ ...current, criteria: undefined })); }} disabled={criteria.length === 1} aria-label={`Remove ${criterion || `criterion ${index + 1}`}`} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-ink/45 transition hover:bg-ember/10 hover:text-ember disabled:cursor-not-allowed disabled:opacity-30"><Trash2 className="h-4 w-4" /></button></div>)}</div>{errors.criteria && <p className="mt-2 text-sm font-medium text-ember" role="alert">{errors.criteria}</p>}<button type="button" onClick={() => setCriteria((current) => current.length < 10 ? [...current, ""] : current)} disabled={criteria.length >= 10} className="mt-3 inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-semibold text-teal transition hover:bg-teal/10 disabled:cursor-not-allowed disabled:opacity-40"><Plus className="h-4 w-4" /> Add criterion</button></div>
        <div className="mt-5 border-t border-ink/8 pt-5"><label htmlFor="scorecard-guidance" className="flex items-center gap-1.5 text-sm font-semibold text-ink"><Info className="h-4 w-4 text-ink/45" /> Guidance for reviewers <span className="font-normal text-ink/45">(optional)</span></label><textarea id="scorecard-guidance" value={instructions} onChange={(event) => setInstructions(event.target.value)} maxLength={1000} rows={3} placeholder="For example: use evidence from the interview and leave actionable notes." className="mt-2 w-full resize-y rounded-xl border border-ink/15 bg-white px-3.5 py-2.5 text-sm leading-5 text-ink outline-none transition placeholder:text-ink/35 focus:border-teal focus:ring-3 focus:ring-teal/10" /><div className="mt-1 text-right text-xs tabular-nums text-ink/40">{instructions.length}/1000</div></div>
        <div className="mt-5 flex flex-col-reverse gap-3 border-t border-ink/8 pt-5 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs leading-5 text-ink/45">Changes apply to future reviews for this role.</p><button type="submit" disabled={saving} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-marigold px-4 py-2.5 text-sm font-bold text-ink shadow-sm transition hover:bg-[#F7B94E] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marigold disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto">{saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{saving ? "Saving setup…" : "Save setup"}</button></div>
      </section>
    </form>
  );
}
