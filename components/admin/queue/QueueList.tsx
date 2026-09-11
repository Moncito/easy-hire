"use client";

import { useEffect, useRef } from "react";
import { AlertOctagon, CheckCircle2, Inbox, Search } from "lucide-react";
import SlaBadge, { AppealBadge, SeverityChips } from "./SlaBadge";
import type { QueueStatus, SerializedQueueItem } from "./types";

/**
 * Dense rows, selection, keyboard nav — docs/ADMIN-CONSOLE-PLAN.md §4.2 /
 * §5: "Admin tables are 32px rows, not 56px." Real <table>, sticky header,
 * numbers right-aligned in font-data. j/k navigation itself lives in the
 * parent shell (ReviewQueue) since it also drives the review pane and the
 * keyboard shortcuts globally — this component only renders the rows and
 * keeps the selected one scrolled into view.
 */

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

  if (items.length === 0 && !loading) {
    const copy = EMPTY_COPY[status];
    if (search.trim()) {
      return (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-ink/5 bg-white py-16 text-center">
          <Search className="h-6 w-6 text-ink/30" aria-hidden="true" />
          <p className="font-display text-base font-bold text-ink">No matches for &ldquo;{search}&rdquo;</p>
          <p className="max-w-xs text-sm text-ink/50">Try a different name, id or search term.</p>
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-ink/5 bg-white py-16 text-center">
        {status === "PENDING" ? (
          <CheckCircle2 className="h-6 w-6 text-teal" aria-hidden="true" />
        ) : (
          <Inbox className="h-6 w-6 text-ink/30" aria-hidden="true" />
        )}
        <p className="font-display text-base font-bold text-ink">{copy.title}</p>
        <p className="max-w-xs text-sm text-ink/50">{copy.body}</p>
      </div>
    );
  }

  const allChecked = items.length > 0 && items.every((i) => checkedIds.has(i.id));

  return (
    <div className="overflow-hidden rounded-2xl border border-ink/5 bg-white">
      <div className="max-h-[65vh] overflow-y-auto">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-mist/95 backdrop-blur-sm">
            <tr className="border-b border-ink/10 text-left text-[10px] font-bold uppercase tracking-wider text-ink/45">
              <th scope="col" className="w-9 px-3 py-2">
                <input
                  type="checkbox"
                  checked={allChecked}
                  onChange={onToggleCheckAll}
                  aria-label="Select all items on this page"
                  className="h-3.5 w-3.5 rounded border-ink/30 text-navy focus-visible:ring-2 focus-visible:ring-navy"
                />
              </th>
              <th scope="col" className="px-2 py-2">
                SLA
              </th>
              <th scope="col" className="px-2 py-2">
                Item
              </th>
              <th scope="col" className="px-2 py-2">
                Signals
              </th>
              <th scope="col" className="px-2 py-2 text-right">
                Age
              </th>
              <th scope="col" className="px-3 py-2 text-right">
                Reach
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const isSelected = item.id === selectedId;
              const isChecked = checkedIds.has(item.id);
              return (
                <tr
                  key={item.id}
                  ref={(el) => {
                    if (el) rowRefs.current.set(item.id, el);
                    else rowRefs.current.delete(item.id);
                  }}
                  aria-selected={isSelected}
                  tabIndex={-1}
                  className={`h-8 cursor-pointer border-b border-ink/5 text-ink/80 transition-colors ${
                    isSelected ? "bg-navy/6" : "hover:bg-ink/[0.03]"
                  }`}
                  onClick={() => onSelect(item.id)}
                >
                  <td className="w-9 px-3 py-0" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => onToggleCheck(item.id)}
                      aria-label={`Select ${item.title} for bulk action`}
                      className="h-3.5 w-3.5 rounded border-ink/30 text-navy focus-visible:ring-2 focus-visible:ring-navy"
                    />
                  </td>
                  <td className="px-2 py-0">
                    <div className="flex items-center gap-1.5">
                      <SlaBadge slaBand={item.slaBand} dense />
                      {item.isAppeal && <AppealBadge />}
                    </div>
                  </td>
                  <td className="max-w-0 px-2 py-0">
                    <p className="truncate font-medium text-ink">{item.title}</p>
                    <p className="truncate text-xs text-ink/45">{item.subtitle}</p>
                  </td>
                  <td className="px-2 py-0">
                    <SeverityChips signals={item.severitySignals} max={2} />
                  </td>
                  <td className="whitespace-nowrap px-2 py-0 text-right font-data text-xs text-ink/60">
                    {item.ageHours < 1 ? "<1h" : `${Math.round(item.ageHours)}h`}
                  </td>
                  <td className="whitespace-nowrap px-3 py-0 text-right font-data text-xs text-ink/60">
                    {item.reach}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {items.some((i) => i.severitySignals.some((s) => s.key === "priorRejection")) && (
        <div className="flex items-center gap-1.5 border-t border-ink/5 bg-mist/60 px-3 py-1.5 text-[11px] text-ink/45">
          <AlertOctagon className="h-3 w-3 shrink-0" aria-hidden="true" />
          Items flagged &ldquo;Prior rejection&rdquo; are appeals — review their history before deciding again.
        </div>
      )}
    </div>
  );
}
