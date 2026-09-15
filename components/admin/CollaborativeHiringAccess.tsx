"use client";

import { CheckCircle2 } from "lucide-react";
import { useState } from "react";

/**
 * `/admin/companies`'s Collaborative Hiring pilot toggle
 * (docs/ADMIN-CONSOLE-PLAN.md §3) — kept as a standalone control on this
 * page rather than folded into the queue shell, since it isn't moderation.
 * Employer Pro companies get Collaborative Hiring automatically; this is
 * only for opting a Free company into a pilot. Turning it off preserves
 * data rather than deleting anything.
 *
 * Reformatted for consistency (docs/ADMIN-UI-UPGRADE.md §3.1/§6.1/§6.2) —
 * behavior is unchanged. Opacity values snapped to the scale the rest of
 * `components/admin` uses (`border-ink/5`, `border-ink/10`, matching e.g.
 * `DataTable.tsx`'s card border and row dividers), the toggle button gained
 * the same `focus-visible` ring every comparable button in this tree
 * carries, and success now announces via the same `aria-live="polite"` +
 * visible-confirmation-line pattern `SupportActions.tsx` uses for its own
 * async actions (the error path was already accessible — `role="alert"`
 * implies its own live region). Left as a plain inline `fetch()` rather than
 * a dedicated `api.ts` module: `ImpersonationBanner.tsx` does the same for
 * its one mutation, so a co-located helper module isn't actually the
 * established pattern for a single-purpose top-level component — only for
 * the multi-endpoint directory/queue/team/etc. shells.
 */

type Company = { id: string; companyName: string; collaborativeHiringEnabled: boolean; user: { email: string } };

export default function CollaborativeHiringAccess({ initialCompanies }: { initialCompanies: Company[] }) {
  const [companies, setCompanies] = useState(initialCompanies);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [announce, setAnnounce] = useState("");

  async function toggle(company: Company) {
    setBusy(company.id);
    setError("");
    setAnnounce("");

    const nextEnabled = !company.collaborativeHiringEnabled;
    const response = await fetch(`/api/admin/companies/${company.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "set_collaborative_hiring", enabled: nextEnabled }),
    });
    const result = await response.json();
    setBusy(null);

    if (!response.ok) {
      setError(result.error || "Could not update access.");
      return;
    }

    setCompanies((items) =>
      items.map((item) =>
        item.id === company.id ? { ...item, collaborativeHiringEnabled: result.collaborativeHiringEnabled } : item
      )
    );
    setAnnounce(
      result.collaborativeHiringEnabled
        ? `${company.companyName} opted into the Collaborative Hiring pilot.`
        : `${company.companyName} removed from the Collaborative Hiring pilot.`
    );
  }

  return (
    <section className="mt-10">
      <div className="mb-4">
        <h2 className="font-display text-2xl font-bold tracking-tight text-ink">Collaborative Hiring pilots</h2>
        <p className="mt-1 text-sm text-ink/55">
          Employer Pro includes this automatically. Use this control only to opt a Free company into a pilot; turning
          it off preserves data.
        </p>
      </div>

      <div aria-live="polite" role="status" className="sr-only">
        {announce}
      </div>
      {announce && (
        <p className="mb-3 flex items-center gap-1.5 text-xs font-medium text-ink/60">
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-teal" aria-hidden="true" />
          {announce}
        </p>
      )}
      {error && (
        <p role="alert" className="mb-3 text-sm text-ember">
          {error}
        </p>
      )}

      <div className="overflow-hidden rounded-2xl border border-ink/5 bg-white shadow-xs">
        <ul className="divide-y divide-ink/5">
          {companies.map((company) => (
            <li key={company.id} className="flex items-center gap-4 px-5 py-4">
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-ink">{company.companyName}</p>
                <p className="truncate text-xs text-ink/50">{company.user.email}</p>
              </div>
              <button
                type="button"
                disabled={busy === company.id}
                onClick={() => void toggle(company)}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${
                  company.collaborativeHiringEnabled ? "bg-teal text-white" : "border border-ink/10 text-ink/65"
                }`}
              >
                {company.collaborativeHiringEnabled ? "Pilot enabled" : "Enable Free pilot"}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
