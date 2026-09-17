"use client";

import { useEffect, useRef, useState } from "react";
import { AlertOctagon, CheckCircle2, Inbox, Rows2, Rows3, Search } from "lucide-react";
import SlaBadge, { AppealBadge, SeverityChips } from "./SlaBadge";
import type { QueueStatus, SerializedQueueItem } from "./types";

/**
 * Dense rows, selection, keyboard nav — docs/ADMIN-CONSOLE-PLAN.md §4.2 /
 * §5: "Admin tables are 32px rows, not 56px." Real <table>, sticky header,
 * numbers right-aligned in font-data. j/k navigation itself lives in the
 * parent shell (ReviewQueue) since it also drives the review pane and the
 * keyboard shortcuts globally — this component only renders the rows and
 * keeps the selected one scrolled into view.
 *
 * Row-density toggle (comfortable/compact) is owned entirely by this
 * component — same "self-contained, per-admin UI preference" shape as
 * AdminHeader.tsx's light/dark toggle: a `density` state plus a separate
 * `densityHydrated` boolean, localStorage read in a mount-only useEffect,
 * and a second useEffect that only persists once hydrated (localStorage has
 * no SSR-safe truth to render against on the first pass, so writing before
 * hydration would either be a no-op or, worse, stamp the default over a
 * previously-saved preference).
 */

const DENSITY_STORAGE_KEY = "eh-admin-queue-density";
type Density = "comfortable" | "compact";

const EMPTY_COPY: Record<QueueStatus, { title: string; body: string }> = {
  PENDING: { title: "Nothing pending", body: "This queue is clear — new submissions land here." },
  APPROVED: { title: "No approved items", body: "Nothing has been approved yet." },
  REJECTED: { title: "No rejected items", body: "Nothing has been rejected yet." },
};

type QueueListProps = {
  items: SerializedQueueItem[];
  status: QueueStatus;
  search: string;
  selectedId: string | null;
  checkedIds: Set<string>;
  onSelect: (id: string) => void;
  onToggleCheck: (id: string) => void;
  onToggleCheckAll: () => void;
  loading: boolean;
};

export default function QueueList({
  items,
  status,
  search,
  selectedId,
  checkedIds,
  onSelect,
  onToggleCheck,
  onToggleCheckAll,
  loading,
}: QueueListProps) {
  const rowRefs = useRef<Map<string, HTMLTableRowElement>>(new Map());

  useEffect(() => {
    if (!selectedId) return;
    rowRefs.current.get(selectedId)?.scrollIntoView({ block: "nearest" });
  }, [selectedId]);

  // ==========================================================================
  // Row-density toggle — persisted per-admin, same hydration-guard shape as
  // AdminHeader.tsx's theme toggle.
  // ==========================================================================
  const [density, setDensity] = useState<Density>("comfortable");
  const [densityHydrated, setDensityHydrated] = useState(false);

  useEffect(() => {
    let stored: Density = "comfortable";
    try {
      const raw = window.localStorage.getItem(DENSITY_STORAGE_KEY);
      if (raw === "comfortable" || raw === "compact") stored = raw;
    } catch {
      // localStorage unavailable — stay comfortable.
    }
    // Same intentional client-only hydration read as AdminHeader.tsx's theme.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional client-only hydration
    setDensity(stored);
    setDensityHydrated(true);
  }, []);

  useEffect(() => {
    if (!densityHydrated) return;
    try {
      window.localStorage.setItem(DENSITY_STORAGE_KEY, density);
    } catch {
      // Failed write just means the preference doesn't persist.
    }
  }, [density, densityHydrated]);

  const isCompact = density === "compact";
  const rowHeightClass = isCompact ? "h-6" : "h-8";
  const headerCellClass = isCompact ? "px-2 py-1" : "px-2 py-1.5";

  if (items.length === 0 && !loading) {
    const copy = EMPTY_COPY[status];
    if (search.trim()) {
      return (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-ink/5 bg-white py-16 text-center admin-dark:border-white/10 admin-dark:bg-white/5">
          <Search className="h-6 w-6 text-ink/30 admin-dark:text-mist/30" aria-hidden="true" />
          <p className="font-display text-base font-bold text-ink admin-dark:text-mist">No matches for &ldquo;{search}&rdquo;</p>
          <p className="max-w-xs text-sm text-ink/50 admin-dark:text-mist/50">Try a different name, id or search term.</p>
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-ink/5 bg-white py-16 text-center admin-dark:border-white/10 admin-dark:bg-white/5">
        {status === "PENDING" ? (
          <CheckCircle2 className="h-6 w-6 text-teal" aria-hidden="true" />
        ) : (
          <Inbox className="h-6 w-6 text-ink/30 admin-dark:text-mist/30" aria-hidden="true" />
        )}
        <p className="font-display text-base font-bold text-ink admin-dark:text-mist">{copy.title}</p>
        <p className="max-w-xs text-sm text-ink/50 admin-dark:text-mist/50">{copy.body}</p>
      </div>
    );
  }

  const allChecked = items.length > 0 && items.every((i) => checkedIds.has(i.id));

  return (
    <div className="overflow-hidden rounded-2xl border border-ink/5 bg-white admin-dark:border-white/10 admin-dark:bg-white/5">
      {/* Row-density toggle — quiet, right-aligned, roughly the same visual
          weight as the "Sorted by risk" caption in ReviewQueue.tsx, not
          competing with the table itself. Active pill reuses the same
          bg-navy/text-ink/55 language as STATUS_TABS in ReviewQueue.tsx. */}
      <div className="flex items-center justify-end gap-2 border-b border-ink/5 px-3 py-1.5 admin-dark:border-white/8">
        <span className="text-[11px] text-ink/45 admin-dark:text-mist/45">Row density</span>
        <div className="inline-flex rounded-lg border border-ink/10 bg-mist/60 p-0.5 admin-dark:border-white/10 admin-dark:bg-white/5">
          <button
            type="button"
            aria-label="Comfortable rows"
            title="Comfortable rows"
            aria-pressed={!isCompact}
            onClick={() => setDensity("comfortable")}
            className={`cursor-pointer inline-flex items-center justify-center rounded-md p-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy ${
              !isCompact
                ? "bg-navy text-white"
                : "text-ink/55 hover:bg-ink/5 admin-dark:text-mist/55 admin-dark:hover:bg-white/10"
            }`}
          >
            <Rows3 className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Compact rows"
            title="Compact rows"
            aria-pressed={isCompact}
            onClick={() => setDensity("compact")}
            className={`cursor-pointer inline-flex items-center justify-center rounded-md p-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy ${
              isCompact
                ? "bg-navy text-white"
                : "text-ink/55 hover:bg-ink/5 admin-dark:text-mist/55 admin-dark:hover:bg-white/10"
            }`}
          >
            <Rows2 className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>
      <div className="max-h-[65vh] overflow-y-auto">
        <table className="w-full table-fixed border-collapse text-sm">
          {/* No explicit z-index here on purpose — `position: sticky` + its own
              `backdrop-blur-sm` already promotes this header to its own GPU
              compositing layer to stay above the plain (position: static) rows
              scrolling beneath it, which needs no z-index to win that fight.
              An explicit `z-10` here previously escaped above z-[100] FIXED
              modals elsewhere in the admin console during hit-testing (a real,
              reproduced Chromium quirk: a sticky+backdrop-filter layer with its
              own z-index can out-rank an unrelated fixed layer's z-index at
              hit-test time, even though paint/z-index rules say it shouldn't) —
              confirmed by removing just this z-index, with `sticky` otherwise
              untouched, which fixed a real mouse-click dead zone over the
              reject-confirmation modal's reason-code dropdown. Don't re-add a
              z-index here without re-testing that exact scenario. */}
          <thead className="sticky top-0 bg-mist/95 backdrop-blur-sm admin-dark:bg-admin-dark-surface/95">
            <tr className="border-b border-ink/10 text-left text-[10px] font-bold uppercase tracking-wider text-ink/45 admin-dark:border-white/10 admin-dark:text-mist/45">
              <th scope="col" className={`w-9 ${headerCellClass}`}>
                <input
                  type="checkbox"
                  checked={allChecked}
                  onChange={onToggleCheckAll}
                  aria-label="Select all items on this page"
                  className="h-3.5 w-3.5 rounded border-ink/30 text-navy focus-visible:ring-2 focus-visible:ring-navy admin-dark:border-white/30"
                />
              </th>
              <th scope="col" className={`w-[36%] ${headerCellClass}`}>
                Item
              </th>
              <th scope="col" className={`w-[28%] ${headerCellClass}`}>
                Signals
              </th>
              <th scope="col" className={`w-[24%] ${headerCellClass}`}>
                SLA
              </th>
              <th scope="col" className={`w-14 ${headerCellClass} text-right`}>
                Age
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const isSelected = item.id === selectedId;
              const isChecked = checkedIds.has(item.id);
              // RED-band === breached (matches SlaBadge.tsx's own SLA_COPY/
              // RED_THRESHOLD_HOURS mapping) — the row-level accent below is
              // a second, at-a-glance rendering of the exact same fact the
              // SlaBadge cell already renders, not a new source of truth.
              const isBreached = item.slaBand === "RED";
              // Left-edge accent bar + row tint, one per row-state, uniform
              // 4px width so toggling selection/breach never reflows the
              // table (only the color/tint changes, border-l-transparent is
              // the shared baseline).
              //
              // Precedence when a row is BOTH selected AND breached: the
              // selection accent (navy) wins the row chrome entirely. Selection
              // is a "you are here" wayfinding signal — there is exactly one
              // selected row at a time — while breach is a persistent property
              // of the item that keeps being true whether or not this row
              // happens to be open right now. Layering ember on top of (or
              // instead of) navy here would make the open row read as an
              // active alert rather than "the thing you're currently looking
              // at", and would fight CLAUDE.md's Ember-is-only-for-warnings
              // rule the moment the row's own state (selected) isn't itself a
              // warning. Nothing is lost: the SlaBadge inside the row still
              // renders RED regardless of selection, so breach status is never
              // hidden — it just isn't fighting the selection accent for the
              // row's outer chrome.
              const rowStateClasses = isSelected
                ? "border-l-4 border-l-navy bg-navy/10 admin-dark:border-l-navy admin-dark:bg-white/14"
                : isBreached
                  ? "border-l-4 border-l-ember bg-ember/5 hover:bg-ember/10 admin-dark:border-l-ember admin-dark:bg-ember/10 admin-dark:hover:bg-ember/15"
                  : "border-l-4 border-l-transparent hover:bg-ink/[0.03] admin-dark:hover:bg-white/5";
              return (
                <tr
                  key={item.id}
                  ref={(el) => {
                    if (el) rowRefs.current.set(item.id, el);
                    else rowRefs.current.delete(item.id);
                  }}
                  aria-selected={isSelected}
                  tabIndex={-1}
                  className={`${rowHeightClass} cursor-pointer border-b border-ink/5 text-ink/80 transition-colors admin-dark:border-white/8 admin-dark:text-mist/80 ${rowStateClasses}`}
                  onClick={() => onSelect(item.id)}
                >
                  <td className="w-9 px-2 py-0" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => onToggleCheck(item.id)}
                      aria-label={`Select ${item.title} for bulk action`}
                      className="h-3.5 w-3.5 rounded border-ink/30 text-navy focus-visible:ring-2 focus-visible:ring-navy admin-dark:border-white/30"
                    />
                  </td>
                  <td className="w-[36%] max-w-0 px-2 py-0">
                    <p className="truncate font-medium text-ink admin-dark:text-mist">{item.title}</p>
                    <p className="truncate text-xs text-ink/45 admin-dark:text-mist/45">{item.subtitle}</p>
                  </td>
                  <td className="w-[28%] overflow-hidden whitespace-nowrap px-2 py-0">
                    <SeverityChips signals={item.severitySignals} max={2} />
                  </td>
                  <td className="w-[24%] overflow-hidden whitespace-nowrap px-2 py-0">
                    <div className="flex items-center gap-1 overflow-hidden">
                      <SlaBadge slaBand={item.slaBand} ageHours={item.ageHours} dense />
                      {item.isAppeal && <AppealBadge />}
                    </div>
                  </td>
                  <td className="w-14 whitespace-nowrap px-2 py-0 text-right font-data text-xs text-ink/60 admin-dark:text-mist/60">
                    {item.ageHours < 1 ? "<1h" : `${Math.round(item.ageHours)}h`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {items.some((i) => i.severitySignals.some((s) => s.key === "priorRejection")) && (
        <div className="flex items-center gap-1.5 border-t border-ink/5 bg-mist/60 px-3 py-1.5 text-[11px] text-ink/45 admin-dark:border-white/10 admin-dark:bg-white/5 admin-dark:text-mist/45">
          <AlertOctagon className="h-3 w-3 shrink-0" aria-hidden="true" />
          Items flagged &ldquo;Prior rejection&rdquo; are appeals — review their history before deciding again.
        </div>
      )}
    </div>
  );
}
