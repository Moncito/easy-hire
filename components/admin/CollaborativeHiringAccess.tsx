"use client";

import { CheckCircle2, CircleDashed, Loader2, Search, Users, XCircle } from "lucide-react";
import { useMemo, useState } from "react";

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
 *
 * Full UI/UX pass (dark mode parity, verification/trust context, avatar
 * chips, search, summary, empty state, and a real switch control instead of
 * a relabeling button) — every visual pattern below is borrowed from an
 * existing admin-console component rather than invented fresh: the
 * `VerifiedStatusChip` colour mapping and avatar/initials treatment mirror
 * `components/admin/queue/ReviewPane.tsx`, the search input mirrors
 * `ReviewQueue.tsx`'s `#queue-search`, and the empty state mirrors
 * `components/admin/queue/QueueList.tsx`. `toggle()` itself is untouched —
 * this pass is markup/styling only.
 */

type Company = {
  id: string;
  companyName: string;
  collaborativeHiringEnabled: boolean;
  verifiedStatus: string;
  trustScore: number | null;
  user: { email: string };
};

/** Same defensive fallback already applied to this identical class of bug
 * this session in `ReviewPane.tsx` (`item.title.trim() || "Untitled"`) and
 * `DecisionForm.tsx` (`itemTitle.trim() || "this item"`) — an empty
 * `companyName` should never render as a blank line. */
function displayName(company: Company): string {
  return company.companyName.trim() || "Untitled company";
}

/** Visual-only replica of `ReviewPane.tsx`'s `getInitials` (not exported from
 * that file) — same "skip leading articles, take first letter of first two
 * remaining words" shape, styled identically (h-10 w-10 rounded-lg navy
 * tint) so this row's avatar chip reads as a sibling of that one. */
const LEADING_STOPWORDS = new Set(["the", "a", "an"]);
function getInitials(name: string): string {
  const allWords = name.trim().split(/\s+/).filter(Boolean);
  const words = allWords.filter((w) => !LEADING_STOPWORDS.has(w.toLowerCase()));
  const source = words.length > 0 ? words : allWords;
  if (source.length === 0) return "?";
  if (source.length === 1) return source[0].slice(0, 2).toUpperCase();
  return (source[0][0] + source[1][0]).toUpperCase();
}

/**
 * Same colour/icon mapping and rounded-full pill shape as `ReviewPane.tsx`'s
 * `VerifiedStatusChip` (navy for PENDING, teal for APPROVED, ember ONLY for
 * REJECTED per CLAUDE.md) — deliberately not re-derived, just mirrored, so
 * "Verified" means the same visual thing on this page as it does in the
 * review queue. Falls back to the neutral PENDING treatment for an
 * unrecognised value, same as the source component.
 */
function VerifiedStatusChip({ status }: { status: string }) {
  const style =
    status === "APPROVED"
      ? { label: "Verified", icon: CheckCircle2, className: "bg-teal/10 text-teal" }
      : status === "REJECTED"
        ? { label: "Verification rejected", icon: XCircle, className: "bg-ember/10 text-ember" }
        : { label: "Verification pending", icon: CircleDashed, className: "bg-navy/8 text-navy admin-dark:bg-navy/25 admin-dark:text-mist" };
  const Icon = style.icon;
  return (
    <span
      title={`Company verification status: ${style.label}`}
      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${style.className}`}
    >
      <Icon className="h-3 w-3 shrink-0" aria-hidden="true" />
      {style.label}
    </span>
  );
}

/**
 * Real switch, not a relabeling button — this is a persistent on/off state
 * (unlike Approve/Reject elsewhere in this console, which are one-shot
 * decisions), so it gets `role="switch"` + `aria-checked`, a visible focus
 * ring, and a busy spinner during the in-flight PATCH — the exact same
 * `busy === company.id` gate the previous button used, just rendered as a
 * spinner instead of disabled button text. Teal for "on" per CLAUDE.md's
 * employer-facing accent.
 */
function CollaborativeHiringSwitch({
  company,
  busy,
  onToggle,
}: {
  company: Company;
  busy: boolean;
  onToggle: () => void;
}) {
  const checked = company.collaborativeHiringEnabled;
  return (
    <span className="inline-flex shrink-0 items-center gap-2">
      {busy && <Loader2 className="h-3.5 w-3.5 animate-spin text-ink/40 admin-dark:text-mist/40" aria-hidden="true" />}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={`Collaborative Hiring pilot for ${displayName(company)}`}
        disabled={busy}
        onClick={onToggle}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${
          checked ? "bg-teal" : "bg-ink/15 admin-dark:bg-white/20"
        }`}
      >
        <span
          aria-hidden="true"
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-[22px]" : "translate-x-1"
          }`}
        />
      </button>
    </span>
  );
}

export default function CollaborativeHiringAccess({ initialCompanies }: { initialCompanies: Company[] }) {
  const [companies, setCompanies] = useState(initialCompanies);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [announce, setAnnounce] = useState("");
  const [search, setSearch] = useState("");

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

  // In-memory filter over the <=100 companies already loaded server-side —
  // no debounce needed at this size, and no new query (search box mirrors
  // ReviewQueue.tsx's #queue-search styling, just wired to local state
  // instead of a server round-trip).
  const normalizedSearch = search.trim().toLowerCase();
  const visibleCompanies = useMemo(() => {
    if (!normalizedSearch) return companies;
    return companies.filter(
      (c) => displayName(c).toLowerCase().includes(normalizedSearch) || c.user.email.toLowerCase().includes(normalizedSearch)
    );
  }, [companies, normalizedSearch]);

  // Derived, client-side, from the already-loaded list — not a new query.
  const enabledCount = companies.filter((c) => c.collaborativeHiringEnabled).length;
  const totalCount = companies.length;

  return (
    <section className="mt-10">
      <div className="mb-4">
        <h2 className="font-display text-2xl font-bold tracking-tight text-ink admin-dark:text-mist">Collaborative Hiring pilots</h2>
        <p className="mt-1 text-sm text-ink/55 admin-dark:text-mist/55">
          Employer Pro includes this automatically. Use this control only to opt a Free company into a pilot; turning
          it off preserves data.
        </p>
      </div>

      <div aria-live="polite" role="status" className="sr-only">
        {announce}
      </div>
      {announce && (
        <p className="mb-3 flex items-center gap-1.5 text-xs font-medium text-ink/60 admin-dark:text-mist/60">
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-teal" aria-hidden="true" />
          {announce}
        </p>
      )}
      {error && (
        <p role="alert" className="mb-3 text-sm text-ember">
          {error}
        </p>
      )}

      {/* Summary — derived from the already-loaded `companies` array, not a
          new query. Kept to a single lightweight stat tile rather than the
          full 4-tile treatment QueueKindStatTiles.tsx uses, per this page's
          much smaller scope. */}
      <div className="mb-4 inline-flex items-center gap-2 rounded-xl border border-ink/5 bg-mist/60 px-4 py-2.5 admin-dark:border-white/10 admin-dark:bg-white/5">
        <Users className="h-4 w-4 shrink-0 text-ink/40 admin-dark:text-mist/40" aria-hidden="true" />
        <p className="text-sm text-ink/70 admin-dark:text-mist/70">
          <span className="font-data font-bold text-ink admin-dark:text-mist">{enabledCount}</span> of{" "}
          <span className="font-data font-bold text-ink admin-dark:text-mist">{totalCount}</span> companies have the
          pilot enabled
        </p>
      </div>

      {/* Search — same styling as ReviewQueue.tsx's #queue-search, filtering
          the already-loaded list in local state only. */}
      <div className="mb-4">
        <label htmlFor="collab-hiring-search" className="sr-only">
          Search companies by name or email
        </label>
        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/30 admin-dark:text-mist/30" aria-hidden="true" />
          <input
            id="collab-hiring-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by company name or email…"
            className="w-full rounded-xl border border-ink/10 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-navy focus:ring-2 focus:ring-navy/20 admin-dark:border-white/15 admin-dark:bg-white/5 admin-dark:text-mist admin-dark:placeholder:text-mist/35"
          />
        </div>
      </div>

      {visibleCompanies.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-ink/15 bg-white/50 py-16 text-center admin-dark:border-white/15 admin-dark:bg-white/5">
          {normalizedSearch ? (
            <>
              <Search className="h-6 w-6 text-ink/30 admin-dark:text-mist/30" aria-hidden="true" />
              <p className="font-display text-base font-bold text-ink admin-dark:text-mist">No matches for &ldquo;{search}&rdquo;</p>
              <p className="max-w-xs text-sm text-ink/50 admin-dark:text-mist/50">Try a different company name or email.</p>
            </>
          ) : (
            <>
              <Users className="h-6 w-6 text-ink/30 admin-dark:text-mist/30" aria-hidden="true" />
              <p className="font-display text-base font-bold text-ink admin-dark:text-mist">No companies yet</p>
              <p className="max-w-xs text-sm text-ink/50 admin-dark:text-mist/50">Companies will appear here once they sign up.</p>
            </>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-ink/5 bg-white shadow-xs admin-dark:border-white/10 admin-dark:bg-white/5">
          <ul className="divide-y divide-ink/5 admin-dark:divide-white/10">
            {visibleCompanies.map((company) => {
              const name = displayName(company);
              return (
                <li key={company.id} className="flex items-center gap-4 px-5 py-4">
                  <div
                    aria-hidden="true"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-navy/10 font-display text-sm font-bold text-navy admin-dark:bg-white/10 admin-dark:text-mist"
                  >
                    {getInitials(name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                      <p className="truncate font-semibold text-ink admin-dark:text-mist">{name}</p>
                      <VerifiedStatusChip status={company.verifiedStatus} />
                    </div>
                    <p className="truncate text-xs text-ink/50 admin-dark:text-mist/50">{company.user.email}</p>
                  </div>
                  <div className="hidden shrink-0 flex-col items-end text-right sm:flex">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-ink/40 admin-dark:text-mist/40">
                      Trust score
                    </span>
                    <span className="font-data text-sm font-semibold text-ink admin-dark:text-mist">
                      {company.trustScore ?? "—"}
                    </span>
                  </div>
                  <CollaborativeHiringSwitch company={company} busy={busy === company.id} onToggle={() => void toggle(company)} />
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}
