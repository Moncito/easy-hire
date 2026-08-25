"use client";

import { useState } from "react";

type Company = { id: string; companyName: string; collaborativeHiringEnabled: boolean; user: { email: string } };

export default function CollaborativeHiringAccess({ initialCompanies }: { initialCompanies: Company[] }) {
  const [companies, setCompanies] = useState(initialCompanies);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  async function toggle(company: Company) {
    setBusy(company.id); setError("");
    const response = await fetch(`/api/admin/companies/${company.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "set_collaborative_hiring", enabled: !company.collaborativeHiringEnabled }) });
    const result = await response.json(); setBusy(null);
    if (!response.ok) return setError(result.error || "Could not update access.");
    setCompanies((items) => items.map((item) => item.id === company.id ? { ...item, collaborativeHiringEnabled: result.collaborativeHiringEnabled } : item));
  }
  return <section className="mt-10"><div className="mb-4"><h2 className="font-display text-2xl font-bold tracking-tight text-ink">Collaborative Hiring pilots</h2><p className="mt-1 text-sm text-ink/55">Employer Pro includes this automatically. Use this control only to opt a Free company into a pilot; turning it off preserves data.</p></div>{error && <p role="alert" className="mb-3 text-sm text-ember">{error}</p>}<div className="overflow-hidden rounded-2xl border border-ink/6 bg-white shadow-xs"><ul className="divide-y divide-ink/6">{companies.map((company) => <li key={company.id} className="flex items-center gap-4 px-5 py-4"><div className="min-w-0 flex-1"><p className="truncate font-semibold text-ink">{company.companyName}</p><p className="truncate text-xs text-ink/50">{company.user.email}</p></div><button disabled={busy === company.id} onClick={() => toggle(company)} className={`rounded-lg px-3 py-2 text-sm font-semibold disabled:opacity-60 ${company.collaborativeHiringEnabled ? "bg-teal text-white" : "border border-ink/12 text-ink/65"}`}>{company.collaborativeHiringEnabled ? "Pilot enabled" : "Enable Free pilot"}</button></li>)}</ul></div></section>;
}
