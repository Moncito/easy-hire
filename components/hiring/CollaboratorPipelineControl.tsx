"use client";

import { useState } from "react";
import { ChevronDown, LoaderCircle } from "lucide-react";

type Props = { companyId: string; jobId: string; applicationId: string; initialStatus: string; canMove: boolean };
const stages = [["APPLIED", "Applied"], ["SHORTLISTED", "Shortlisted"], ["INTERVIEW", "Interview"], ["HIRED", "Hired"], ["REJECTED", "Rejected"]] as const;

export default function CollaboratorPipelineControl({ companyId, jobId, applicationId, initialStatus, canMove }: Props) {
  const [status, setStatus] = useState(initialStatus);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  if (!canMove) return <span className="inline-flex items-center rounded-full bg-ink/[0.05] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-ink/50">{status.toLowerCase()}</span>;
  async function change(next: string) {
    if (next === status) return;
    setSaving(true); setError("");
    const response = await fetch(`/api/hiring/${companyId}/jobs/${jobId}/applications/${applicationId}/pipeline`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: next }) });
    const result = await response.json(); setSaving(false);
    if (!response.ok) return setError(result.error || "Could not update the candidate stage.");
    setStatus(result.status);
  }
  const currentLabel = stages.find(([value]) => value === status)?.[1] ?? status;
  return <div className="relative"><button type="button" aria-haspopup="listbox" aria-expanded={open} disabled={saving} onClick={() => setOpen((value) => !value)} className="inline-flex min-w-36 cursor-pointer items-center justify-between gap-3 rounded-full border border-teal/35 bg-white px-4 py-2.5 text-left text-xs font-bold text-ink outline-none transition hover:border-teal hover:shadow-[0_4px_14px_rgba(31,128,115,0.12)] focus-visible:ring-3 focus-visible:ring-teal/15 disabled:cursor-not-allowed disabled:opacity-60">{currentLabel}{saving ? <LoaderCircle className="h-3.5 w-3.5 animate-spin text-teal" /> : <ChevronDown className={`h-3.5 w-3.5 text-teal transition ${open ? "rotate-180" : ""}`} />}</button>{open && <div role="listbox" aria-label="Candidate stage" className="absolute right-0 z-30 mt-2 w-44 overflow-hidden rounded-xl border border-ink/10 bg-white p-1 shadow-[0_12px_30px_rgba(32,36,43,0.14)]">{stages.map(([value, name]) => <button type="button" role="option" aria-selected={value === status} key={value} onClick={() => { setOpen(false); void change(value); }} className={`flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${value === status ? "bg-teal/10 font-bold text-teal" : "text-ink/75 hover:bg-mist"}`}>{name}{value === status && <span className="h-1.5 w-1.5 rounded-full bg-teal" />}</button>)}</div>}{error && <p role="alert" className="absolute right-0 top-full mt-1 w-56 text-right text-xs text-ember">{error}</p>}</div>;
}
