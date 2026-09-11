"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Briefcase, Building2, Command, Loader2, Search, User as UserIcon, X } from "lucide-react";
import { fetchUserDirectoryPage, fetchJobDirectoryPage } from "@/components/admin/directory/api";
import { RoleBadge } from "@/components/admin/directory/badges";
import type { SerializedJobDirectoryItem, SerializedUserDirectoryItem } from "@/components/admin/directory/types";

/**
 * ⌘K / Ctrl+K jump-to — docs/ADMIN-CONSOLE-PLAN.md §5: "the single
 * highest-value ergonomic addition." Mounted once in app/admin/layout.tsx so
 * it works on every admin page.
 *
 * BACKEND GAP, reported rather than worked around by touching /lib or
 * /app/api (outside this agent's territory): there is no company
 * search-by-name/id endpoint. `lib/admin/companies.ts` only exposes
 * `listPendingCompanies` (PENDING-only, no search) and
 * `listCompaniesForCollaborativeHiring` (capped at 100, no search) — neither
 * is a searchable directory, and `Company.id` is never present on
 * `UserDirectoryItem` (an EMPLOYER row there carries only the owning
 * `User.id`), so a company can't be reached from a user-directory search
 * result either. This palette's "Companies" section is therefore DERIVED
 * from job-directory search results (`JobDirectoryItem.companyId` +
 * `companyName`, deduplicated) — it only surfaces companies that have
 * posted at least one job in any status. A company with zero jobs is
 * findable only via its EMPLOYER user's 360 record. The real fix is a
 * `listCompanyDirectory`/company-search `/lib` function and API route —
 * flagged for the backend agent, not built here.
 *
 * There is also no per-job detail page in this phase, so Job results route
 * to the job directory pre-filtered to that job's title, not a specific row.
 *
 * Debounced input, in-flight requests cancelled via `AbortController` on
 * every keystroke, full keyboard operation via the standard ARIA combobox +
 * listbox pattern (`aria-activedescendant`, arrow keys move the active
 * option, Enter commits, Escape closes) rather than a custom `role="link"`
 * hack, and a focus trap while open.
 */

type PaletteItem = {
  id: string;
  kind: "user" | "job" | "company";
  label: string;
  sublabel: string;
  href: string;
  meta?: SerializedUserDirectoryItem;
};

const DEBOUNCE_MS = 200;
const MIN_QUERY_LENGTH = 2;

function buildCompanyItems(jobs: SerializedJobDirectoryItem[]): PaletteItem[] {
  const seen = new Map<string, PaletteItem>();
  for (const job of jobs) {
    if (seen.has(job.companyId)) continue;
    seen.set(job.companyId, {
      id: `company-${job.companyId}`,
      kind: "company",
      label: job.companyName,
      sublabel: "Company",
      href: `/admin/companies/${job.companyId}`,
    });
  }
  return Array.from(seen.values()).slice(0, 5);
}

function buildUserItems(users: SerializedUserDirectoryItem[]): PaletteItem[] {
  return users.slice(0, 6).map((u) => ({
    id: `user-${u.id}`,
    kind: "user",
    label: u.displayName ?? u.email,
    sublabel: u.displayName ? u.email : u.role,
    href: `/admin/users/${u.id}`,
    meta: u,
  }));
}

function buildJobItems(jobs: SerializedJobDirectoryItem[]): PaletteItem[] {
  return jobs.slice(0, 6).map((j) => ({
    id: `job-${j.id}`,
    kind: "job",
    label: j.title,
    sublabel: `${j.companyName} · Job`,
    href: `/admin/jobs/directory?search=${encodeURIComponent(j.title)}`,
  }));
}

export default function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  // Results and errors are tagged with the query they answer. That makes
  // `loading` a derived value — a fetch is in flight exactly when the current
  // query is searchable and neither a result nor an error has come back for
  // it yet — so the fetch effect no longer needs `setLoading(true)` /
  // `setError(null)` in its body, which react-hooks/set-state-in-effect
  // rejects. It also removes the stale-render window where the previous
  // query's results showed while the new ones were still on the wire.
  const [result, setResult] = useState<{
    forQuery: string;
    users: SerializedUserDirectoryItem[];
    jobs: SerializedJobDirectoryItem[];
  } | null>(null);
  const [error, setError] = useState<{ forQuery: string; message: string } | null>(null);
  // The highlighted row is tagged with the query it belongs to instead of
  // being reset by an effect when `items` changes. That effect was a
  // setState-in-effect (a hard error under react-hooks/set-state-in-effect)
  // and it also highlighted a stale row for one frame after new results
  // landed. Deriving is both correct and cheaper: a selection from an older
  // query simply doesn't apply, and the clamp keeps the index in range when
  // a new result set is shorter than the old one.
  const [selection, setSelection] = useState<{ forQuery: string; index: number }>({ forQuery: "", index: 0 });

  const inputRef = useRef<HTMLInputElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerElementRef = useRef<Element | null>(null);

  const searchable = debouncedQuery.length >= MIN_QUERY_LENGTH;
  const fresh = result && result.forQuery === debouncedQuery ? result : null;

  const items: PaletteItem[] = useMemo(() => {
    if (!fresh) return [];
    return [...buildUserItems(fresh.users), ...buildCompanyItems(fresh.jobs), ...buildJobItems(fresh.jobs)];
  }, [fresh]);

  const activeIndex =
    selection.forQuery === debouncedQuery ? Math.min(selection.index, Math.max(0, items.length - 1)) : 0;

  // An error only applies to the query that produced it, so a stale one can
  // never linger once the input changes or drops below the search threshold.
  const visibleError = searchable && error?.forQuery === debouncedQuery ? error.message : null;
  const loading = searchable && !fresh && !visibleError;

  const setActiveIndex = useCallback(
    (index: number) => setSelection({ forQuery: debouncedQuery, index }),
    [debouncedQuery]
  );

  const closePalette = useCallback(() => {
    setOpen(false);
    setQuery("");
    setDebouncedQuery("");
    setResult(null);
    setError(null);
    setSelection({ forQuery: "", index: 0 });
    // No abort call here — clearing `debouncedQuery` re-runs the fetch effect,
    // whose cleanup aborts the in-flight request for us.
  }, []);

  // Global ⌘K / Ctrl+K toggle — works from any admin page.
  //
  // Closing goes through `closePalette`, NOT a bare `setOpen(false)`. A plain
  // toggle hides the overlay but leaves `query`, `debouncedQuery`, `result`
  // and `selection` behind, so the next ⌘K reopens onto the previous search
  // instead of an empty box — which is exactly how every other close path
  // (the X button, the backdrop, Escape) already behaves. One close path,
  // one behaviour.
  //
  // This depends on `open`, so the listener re-registers on toggle. That is
  // cheap and is the price of not duplicating the reset logic here.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (open) closePalette();
        else setOpen(true);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, closePalette]);

  // Focus management + focus trap while open, same pattern as
  // components/admin/queue/BulkBar.tsx's TypedConfirmDialog.
  useEffect(() => {
    if (!open) return;
    triggerElementRef.current = document.activeElement;
    inputRef.current?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        closePalette();
        return;
      }
      if (e.key === "Tab" && dialogRef.current) {
        // Excludes the result buttons — they carry `tabIndex={-1}` on purpose
        // (the ARIA combobox pattern keeps focus on the input; arrow keys
        // move `aria-activedescendant`, not real DOM focus, through the list).
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([tabindex="-1"]), input:not([tabindex="-1"]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      if (triggerElementRef.current instanceof HTMLElement) {
        triggerElementRef.current.focus();
      }
    };
  }, [open, closePalette]);

  // Debounce the query.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [query]);

  // Fetch users + jobs in parallel, cancelling any superseded in-flight
  // request via AbortController — a fast typist must never see a stale
  // response for an earlier keystroke land after a newer one.
  useEffect(() => {
    // No setState in this body — `loading`, `items` and `visibleError` all
    // derive from whether a tagged result has come back for this query yet.
    if (debouncedQuery.length < MIN_QUERY_LENGTH) return;

    const controller = new AbortController();
    const forQuery = debouncedQuery;

    Promise.all([
      fetchUserDirectoryPage({ search: forQuery, limit: 6 }, controller.signal),
      fetchJobDirectoryPage({ search: forQuery, limit: 10 }, controller.signal),
    ])
      .then(([usersRes, jobsRes]) => {
        setResult({ forQuery, users: usersRes.items, jobs: jobsRes.items });
      })
      .catch((e) => {
        // An aborted request was superseded by a newer keystroke — its result
        // is irrelevant, and reporting it as an error would flash a failure
        // for a search the user has already moved on from.
        if (e instanceof DOMException && e.name === "AbortError") return;
        setError({ forQuery, message: e instanceof Error ? e.message : "Search failed." });
      });

    // Cleanup, not a manually-tracked ref: React runs this before the next
    // run and on unmount, which covers all three cases the old `abortRef`
    // was juggling — a superseding keystroke, the palette closing (which
    // resets `debouncedQuery` and so re-runs this effect), and unmount. It
    // also keeps `closePalette` free of ref reads, which react-hooks/refs
    // flagged when that function was passed to a JSX event handler.
    return () => controller.abort();
  }, [debouncedQuery]);

  const navigateTo = useCallback(
    (item: PaletteItem) => {
      closePalette();
      router.push(item.href);
    },
    [closePalette, router]
  );

  function onInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (items.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((activeIndex + 1) % items.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((activeIndex - 1 + items.length) % items.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const active = items[activeIndex];
      if (active) navigateTo(active);
    }
  }

  if (!open) return null;

  const listboxId = "admin-command-palette-listbox";
  const activeItem = items[activeIndex];

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center bg-ink/40 px-4 pt-[12vh]" onClick={closePalette}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Jump to a user, company or job"
        className="w-full max-w-xl overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-ink/10 px-4 py-3">
          <Search className="h-4 w-4 shrink-0 text-ink/35" aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded={items.length > 0}
            aria-controls={listboxId}
            aria-activedescendant={activeItem ? `${listboxId}-${activeItem.id}` : undefined}
            aria-autocomplete="list"
            aria-label="Search users, companies and jobs"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onInputKeyDown}
            placeholder="Jump to a user, company or job…"
            className="flex-1 border-none bg-transparent text-sm text-ink outline-none placeholder:text-ink/35"
          />
          {loading && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-ink/30" aria-hidden="true" />}
          <button
            ref={closeButtonRef}
            type="button"
            onClick={closePalette}
            aria-label="Close command palette"
            className="shrink-0 rounded-lg p-1 text-ink/40 hover:bg-ink/5 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div aria-live="polite" className="sr-only">
          {debouncedQuery.length >= MIN_QUERY_LENGTH && !loading
            ? `${items.length} result${items.length === 1 ? "" : "s"} for "${debouncedQuery}"`
            : ""}
        </div>

        <div className="max-h-96 overflow-y-auto py-1" role="listbox" id={listboxId} aria-label="Search results">
          {visibleError ? (
            <p className="px-4 py-6 text-center text-sm text-ember">{visibleError}</p>
          ) : debouncedQuery.length < MIN_QUERY_LENGTH ? (
            <p className="px-4 py-6 text-center text-sm text-ink/40">Type at least 2 characters to search.</p>
          ) : items.length === 0 && !loading ? (
            <p className="px-4 py-6 text-center text-sm text-ink/40">No matches for &ldquo;{debouncedQuery}&rdquo;.</p>
          ) : (
            items.map((item, index) => {
              const Icon = item.kind === "user" ? UserIcon : item.kind === "company" ? Building2 : Briefcase;
              const isActive = index === activeIndex;
              return (
                <button
                  key={item.id}
                  id={`${listboxId}-${item.id}`}
                  role="option"
                  aria-selected={isActive}
                  type="button"
                  tabIndex={-1}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => navigateTo(item)}
                  className={`flex w-full items-center gap-3 px-4 py-2 text-left text-sm transition-colors ${
                    isActive ? "bg-navy/8" : "hover:bg-ink/[0.03]"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0 text-ink/40" aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-ink">{item.label}</span>
                    <span className="block truncate text-xs text-ink/45">{item.sublabel}</span>
                  </span>
                  {item.meta && <RoleBadge role={item.meta.role} />}
                </button>
              );
            })
          )}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-ink/5 px-4 py-2 text-[11px] text-ink/35">
          <span className="flex items-center gap-1">
            <Command className="h-3 w-3" aria-hidden="true" />K to toggle
          </span>
          <span>↑↓ to move · Enter to open · Esc to close</span>
        </div>
      </div>
    </div>
  );
}
