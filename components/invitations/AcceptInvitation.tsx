"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, BadgeCheck, BriefcaseBusiness, CalendarDays, Check, LockKeyhole, ShieldCheck, Sparkles, UsersRound } from "lucide-react";

type Role = "OWNER" | "RECRUITER" | "HIRING_MANAGER" | "VIEWER";
type Invitation = { email: string; role: Role; expiresAt: string; company: { companyName: string; logoUrl: string | null } };

const roleCopy: Record<Role, { label: string; description: string; items: string[] }> = {
  OWNER: { label: "Owner", description: "Full workspace control", items: ["Manage the hiring team", "Manage jobs and applicants", "Set up hiring workflows"] },
  RECRUITER: { label: "Recruiter", description: "Candidate and pipeline access", items: ["Review applicants", "Manage hiring pipeline", "Coordinate team feedback"] },
  HIRING_MANAGER: { label: "Hiring manager", description: "Assigned-role review access", items: ["Review assigned roles", "Submit hiring feedback", "Participate in interviews"] },
  VIEWER: { label: "Viewer", description: "Read-only workspace access", items: ["View jobs and applicants", "Review team feedback", "No editing permissions"] },
};

export default function AcceptInvitation({ token, invitation, signedInEmail }: { token: string; invitation: Invitation | null; signedInEmail?: string | null }) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");
  const [error, setError] = useState("");

  async function accept() {
    setStatus("loading"); setError("");
    const response = await fetch(`/api/invitations/${encodeURIComponent(token)}/accept`, { method: "POST" });
    const data = await response.json();
    if (!response.ok) { setStatus("idle"); return setError(data.error || "Could not accept invitation."); }
    setStatus("done");
    router.push("/hiring");
  }

  if (!invitation) return <main className="min-h-screen bg-mist px-5 py-12"><div className="mx-auto max-w-md pt-[18vh]"><p className="text-xs font-bold uppercase tracking-[0.16em] text-teal">EasyHire</p><h1 className="mt-3 font-display text-3xl font-black tracking-tighter text-ink">This invitation is no longer available.</h1><p className="mt-3 text-sm leading-6 text-ink/60">It may have expired, been revoked, or already been accepted. Ask the company to send you a fresh invitation.</p></div></main>;

  const role = roleCopy[invitation.role];
  const emailMatches = signedInEmail?.toLowerCase() === invitation.email.toLowerCase();
  const expiry = new Date(invitation.expiresAt).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });

  return <main className="relative flex min-h-screen items-center overflow-hidden bg-mist px-5 py-8 sm:px-8"><div className="pointer-events-none absolute -left-32 top-1/4 h-80 w-80 rounded-full bg-teal/[0.08] blur-3xl" /><div className="pointer-events-none absolute -right-32 bottom-1/4 h-80 w-80 rounded-full bg-marigold/[0.12] blur-3xl" /><div className="relative mx-auto w-full max-w-5xl"><div className="mb-5 flex items-center justify-center gap-3 text-sm font-bold text-ink"><span className="relative flex h-9 w-9 overflow-hidden rounded-full shadow-sm"><span className="absolute inset-0 bg-marigold" style={{ clipPath: "polygon(0 0, 100% 0, 0 100%)" }} /><span className="absolute inset-0 bg-teal" style={{ clipPath: "polygon(100% 0, 100% 100%, 0 100%)" }} /></span><span className="font-display text-lg font-black tracking-tighter">EasyHire</span><span className="h-4 border-l border-ink/15" /><span className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink/45">Collaborative hiring</span></div><section className="overflow-hidden rounded-[28px] border border-ink/8 bg-white shadow-[0_20px_60px_rgba(32,36,43,0.09)] md:grid md:grid-cols-[.9fr_1.1fr]"><aside className="relative overflow-hidden bg-ink p-7 text-white sm:p-9"><div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-teal/25 blur-3xl" /><div className="relative"><div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-white/15 bg-white/10">{invitation.company.logoUrl ? <img src={invitation.company.logoUrl} alt={`${invitation.company.companyName} logo`} className="h-full w-full object-cover" /> : <span className="font-display text-xl font-bold text-marigold">{invitation.company.companyName.slice(0, 2).toUpperCase()}</span>}</div><p className="mt-8 text-[10px] font-bold uppercase tracking-[0.16em] text-marigold">You’re invited to collaborate</p><h1 className="mt-3 font-display text-3xl font-black tracking-tighter sm:text-4xl sm:leading-[0.95]">{invitation.company.companyName}</h1><p className="mt-4 text-sm leading-6 text-mist/65">Join the private hiring workspace and help the team make thoughtful decisions, together.</p><div className="mt-10 border-t border-white/10 pt-5"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-mist/45">Your invitation</p><p className="mt-2 text-sm font-semibold text-white">{role.label}</p><p className="mt-1 text-sm text-mist/60">{role.description}</p></div></div></aside><div className="p-7 sm:p-9"><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.13em] text-teal"><BadgeCheck className="h-4 w-4" />Secure invitation</div><h2 className="mt-3 font-display text-3xl font-black tracking-tighter text-ink">Review your access</h2><p className="mt-2 text-sm leading-6 text-ink/60">Accepting adds this workspace to your EasyHire account. Your job-seeker profile and applications stay private and separate.</p><div className="mt-7 border-y border-ink/7 py-5"><div className="flex items-start gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal/10 text-teal"><BriefcaseBusiness className="h-4 w-4" /></div><div><p className="font-semibold text-ink">As a {role.label.toLowerCase()}, you can:</p><ul className="mt-2 space-y-1.5">{role.items.map((item) => <li key={item} className="flex items-center gap-2 text-sm text-ink/60"><Check className="h-3.5 w-3.5 text-teal" />{item}</li>)}</ul></div></div></div><div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-ink/50"><span className="inline-flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" />Expires {expiry}</span><span className="inline-flex items-center gap-1.5"><LockKeyhole className="h-3.5 w-3.5" />Only {invitation.email} can accept</span></div>{!emailMatches ? <div className="mt-6 rounded-xl border border-ember/20 bg-ember/[0.05] px-4 py-3 text-sm text-ember">You’re signed in as {signedInEmail ?? "a different account"}. Sign in with {invitation.email} to accept this invitation.</div> : <><button onClick={accept} disabled={status !== "idle"} className="mt-7 inline-flex items-center gap-2 rounded-xl bg-marigold px-5 py-3 text-sm font-bold text-ink transition hover:bg-marigold/90 disabled:opacity-60">{status === "loading" ? "Joining workspace…" : status === "done" ? "Workspace added" : "Accept and open workspace"}<ArrowRight className="h-4 w-4" /></button><p className="mt-3 inline-flex items-center gap-1.5 text-xs text-ink/45"><ShieldCheck className="h-3.5 w-3.5 text-teal" />You can leave a workspace later through company support.</p></>}</div></section></div></main>;
}
