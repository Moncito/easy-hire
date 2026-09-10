"use client";

import { useEffect, useRef, useState } from "react";
import { HelpCircle, RefreshCcw, Search } from "lucide-react";
import QueueList from "./queue/QueueList";
import ReviewPane from "./queue/ReviewPane";
import BulkBar from "./queue/BulkBar";
import ShortcutSheet from "./queue/ShortcutSheet";
import { fetchQueueItemDetail, fetchQueuePage, submitBulkDecision, submitSingleDecision } from "./queue/api";
import type { DecisionAction, DecisionFormHandle } from "./queue/DecisionForm";
import type {
  QueueKind,
  QueueStatus,
  ReasonCodeOption,
  SerializedQueueItem,
  SerializedQueueItemDetail,
} from "./queue/types";
import type { BulkReviewQueueResult } from "@/lib/admin/bulk";

/**
 * THE ONE SHELL, FOUR DATA SOURCES — docs/ADMIN-CONSOLE-PLAN.md §4.2:
 * "Every queue gets the same shell. One component, four data sources."
 * This is the single client component every `/admin/queues/[kind]` page
 * renders (COMPANY / SEEKER / JOB / REVIEW) — no per-kind duplication of the
 * list, pane, bulk bar or keyboard behaviour. Everything that differs by
 * kind (labels, reason-code vocabulary, approve/reject vs restore/hide) is
 * read from `kind` and the `reasonCodes` prop, never branched into a
 * separate component tree.
 *
 * Data contract:
 *  - `initialItems`/`initialNextCursor` are the server-rendered first page
 *    (§5: "Server components for reads") — this component never re-fetches
 *    that exact page on mount, only on a subsequent status/search change or
 *    "load more".
 *  - All later reads go through the client fetch helpers in ./queue/api.ts,
 *    which call the existing `/api/admin/queues*` endpoints exactly as
 *    documented in the task brief — this component has no knowledge of
 *    Prisma, signed URLs, or audit logging.
 */

const STATUS_TABS: { value: QueueStatus; label: string }[] = [
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
];

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
}

const ACTION_VERB: Record<DecisionAction, string> = {
  approve: "approve",
  reject: "reject",
  restore: "restore",
  hide: "hide",
};

const ACTION_PAST: Record<DecisionAction, string> = {
  approve: "Approved",
  reject: "Rejected",
  restore: "Restored",
  hide: "Hidden",
};

export type ReviewQueueProps = {
  kind: QueueKind;
  initialItems: SerializedQueueItem[];
  initialNextCursor: string | null;
  initialStatus?: QueueStatus;
  reasonCodes: ReasonCodeOption[];
};

export default function ReviewQueue({
  kind,
  initialItems,
  initialNextCursor,
  initialStatus = "PENDING",
  reasonCodes,
}: ReviewQueueProps) {
  const [status, setStatus] = useState<QueueStatus>(initialStatus);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [items, setItems] = useState<SerializedQueueItem[]>(initialItems);
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor);
  const [loadingList, setLoadingList] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());

  // Detail and its error are tagged with the id they belong to, rather than
  // being cleared whenever the selection changes. Clearing meant a setState in
  // the selection effect (what react-hooks/set-state-in-effect flags), and it
  // also let the PREVIOUS item's detail flash in the pane for one render after
  // selecting a new row. Deriving on `forId` fixes both: detail that isn't for
  // the current selection simply isn't shown.
  const [detail, setDetail] = useState<{ forId: string; data: SerializedQueueItemDetail } | null>(null);
  const [detailError, setDetailError] = useState<{ forId: string; message: string } | null>(null);
  const [detailReloadToken, setDetailReloadToken] = useState(0);

  const [decisionPendingId, setDecisionPendingId] = useState<string | null>(null);
  const [lastBulkResult, setLastBulkResult] = useState<{ action: string; result: BulkReviewQueueResult } | null>(null);
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
  const [shortcutSheetOpen, setShortcutSheetOpen] = useState(false);
  const [announce, setAnnounce] = useState("");

  const nextCursorRef = useRef<string | null>(initialNextCursor);
  const decisionFormRef = useRef<DecisionFormHandle>(null);
  const didMountRef = useRef(false);

  useEffect(() => {
    nextCursorRef.current = nextCursor;
  }, [nextCursor]);

  // Debounce the search box — refetch 300ms after the operator stops typing.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  async function loadPage(reset: boolean) {
    setLoadingList(true);
    setListError(null);
    try {
      const res = await fetchQueuePage({
        kind,
        status,
        search: debouncedSearch || undefined,
        cursor: reset ? undefined : nextCursorRef.current,
        limit: 25,
      });
      setItems((prev) => (reset ? res.items : [...prev, ...res.items]));
      setNextCursor(res.nextCursor);
      if (reset) {
        setSelectedId(null);
        setCheckedIds(new Set());
      }
    } catch (e) {
      setListError(e instanceof Error ? e.message : "Failed to load the queue.");
    } finally {
      setLoadingList(false);
    }
  }

  // Status tab or search change -> refetch from the top. Skips the very
  // first render, which already has the server-rendered first page.
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    void loadPage(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, debouncedSearch]);

  // Per-item detail — fetched lazily only for the selected item, never for
  // the whole list (lib/admin/queue-detail.ts's own rationale).
  useEffect(() => {
    if (!selectedId) return;
    const forId = selectedId;
    let cancelled = false;
    fetchQueueItemDetail(kind, forId)
      .then((d) => {
        if (!cancelled) setDetail({ forId, data: d });
      })
      .catch((e) => {
        if (!cancelled) {
          setDetailError({ forId, message: e instanceof Error ? e.message : "Failed to load this item." });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [kind, selectedId, detailReloadToken]);

  // Only ever surface detail that belongs to the CURRENT selection; anything
  // tagged with another id is a stale in-flight or previous-item response.
  const activeDetail = detail && detail.forId === selectedId ? detail.data : null;
  const activeDetailError = detailError && detailError.forId === selectedId ? detailError.message : null;

  const selectedIndex = items.findIndex((i) => i.id === selectedId);
  const selectedItem = selectedIndex >= 0 ? items[selectedIndex] : null;

  function selectByIndex(idx: number) {
    if (items.length === 0) return;
    const clamped = Math.max(0, Math.min(items.length - 1, idx));
    setSelectedId(items[clamped].id);
  }

  function toggleCheck(id: string) {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleCheckAll() {
    setCheckedIds((prev) => {
      const allChecked = items.length > 0 && items.every((i) => prev.has(i.id));
      return allChecked ? new Set() : new Set(items.map((i) => i.id));
    });
  }

  async function handleDecide(
    action: DecisionAction,
    opts: { reason?: string; note?: string; reasonCode?: string }
  ): Promise<boolean> {
    if (!selectedItem) return false;
    const item = selectedItem;
    const prevItems = items;
    const leavesTab = status === "PENDING";

    if (leavesTab) {
      setItems((cur) => cur.filter((i) => i.id !== item.id));
    }
    setDecisionPendingId(item.id);

    const body: Record<string, unknown> =
      kind === "REVIEW"
        ? { action, note: opts.note, reasonCode: opts.reasonCode }
        : { action, reason: opts.reason, reasonCode: opts.reasonCode };

    const result = await submitSingleDecision(kind, item.id, body);
    setDecisionPendingId(null);

    if (!result.ok) {
      if (leavesTab) setItems(prevItems); // roll back the optimistic removal
      setAnnounce(`Could not ${ACTION_VERB[action]} ${item.title}: ${result.error}`);
      return false;
    }

    setAnnounce(`${ACTION_PAST[action]} ${item.title}.`);
    if (leavesTab) {
      setSelectedId(null);
      setCheckedIds((prev) => {
        if (!prev.has(item.id)) return prev;
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }
    return true;
  }

  function applySucceededRemoval(succeededIds: Set<string>) {
    if (status === "PENDING") {
      setItems((cur) => cur.filter((i) => !succeededIds.has(i.id)));
    }
    setCheckedIds((prev) => {
      const next = new Set(prev);
      succeededIds.forEach((id) => next.delete(id));
      return next;
    });
    if (selectedId && succeededIds.has(selectedId)) {
      setSelectedId(null);
    }
  }

  async function handleBulkApprove() {
    const ids = Array.from(checkedIds);
    if (ids.length === 0) return;
    const action = kind === "REVIEW" ? "restore" : "approve";
    const label = kind === "REVIEW" ? "Restore" : "Approve";
    const res = await submitBulkDecision({ kind, ids, action });
    if (!res.ok) {
      setAnnounce(`Bulk ${label.toLowerCase()} failed to send: ${res.error}`);
      return;
    }
    setLastBulkResult({ action: label, result: res.result });
    setAnnounce(`${label}: ${res.result.succeeded} succeeded, ${res.result.failed} failed.`);
    applySucceededRemoval(new Set(res.result.results.filter((r) => r.ok).map((r) => r.id)));
  }

  async function handleBulkReject(opts: { reasonCode: string; reason?: string; note?: string }) {
    const ids = Array.from(checkedIds);
    if (ids.length === 0) return;
    const action = kind === "REVIEW" ? "hide" : "reject";
    const label = kind === "REVIEW" ? "Hide" : "Reject";
    const res = await submitBulkDecision({
      kind,
      ids,
      action,
      reasonCode: opts.reasonCode,
      reason: opts.reason,
      note: opts.note,
    });
    if (!res.ok) {
      setAnnounce(`Bulk ${label.toLowerCase()} failed to send: ${res.error}`);
      return;
    }
    setLastBulkResult({ action: label, result: res.result });
    setAnnounce(`${label}: ${res.result.succeeded} succeeded, ${res.result.failed} failed.`);
    applySucceededRemoval(new Set(res.result.results.filter((r) => r.ok).map((r) => r.id)));
  }

  // Global keyboard shortcuts — docs/ADMIN-CONSOLE-PLAN.md §4.2: j/k move,
  // a approve, r reject (focuses reason), Enter commit, ? toggles the sheet.
  // Suppressed while typing in a field or while any overlay is open.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (shortcutSheetOpen) {
        return; // ShortcutSheet owns Escape/Tab while it's open
      }
      if (bulkConfirmOpen) {
        return; // TypedConfirmDialog owns Escape/Tab while it's open
      }
      if (isTypingTarget(e.target)) {
        return;
      }

      if (e.key === "?") {
        e.preventDefault();
        setShortcutSheetOpen(true);
        return;
      }
      if (e.key === "j") {
        e.preventDefault();
        selectByIndex(selectedIndex < 0 ? 0 : selectedIndex + 1);
        return;
      }
      if (e.key === "k") {
        e.preventDefault();
        selectByIndex(selectedIndex < 0 ? 0 : selectedIndex - 1);
        return;
      }
      if (e.key === "a") {
        e.preventDefault();
        if (selectedItem && decisionPendingId === null) {
          void handleDecide(kind === "REVIEW" ? "restore" : "approve", {});
        }
        return;
      }
      if (e.key === "r") {
        e.preventDefault();
        decisionFormRef.current?.focusReject();
        return;
      }
      if (e.key === "Enter") {
        decisionFormRef.current?.commit();
        return;
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIndex, selectedItem, decisionPendingId, kind, shortcutSheetOpen, bulkConfirmOpen, items]);

  const allChecked = items.length > 0 && items.every((i) => checkedIds.has(i.id));

  return (
    <div className="space-y-4">
      {/* aria-live region — every approve/reject/restore/hide outcome and
          bulk breakdown is announced here, not only shown visually. */}
      <div aria-live="polite" role="status" className="sr-only">
        {announce}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-xl border border-ink/10 bg-white p-1">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              aria-pressed={status === tab.value}
              onClick={() => setStatus(tab.value)}
              className={`rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy ${
                status === tab.value ? "bg-navy text-white" : "text-ink/55 hover:bg-ink/5"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="queue-search" className="sr-only">
            Search this queue
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/30" aria-hidden="true" />
            <input
              id="queue-search"
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name, id, email…"
              className="w-64 rounded-xl border border-ink/10 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-navy focus:ring-2 focus:ring-navy/20"
            />
          </div>
          <button
            type="button"
            onClick={() => setShortcutSheetOpen(true)}
            aria-label="Show keyboard shortcuts"
            title="Keyboard shortcuts (?)"
            className="rounded-xl border border-ink/10 bg-white p-2 text-ink/50 hover:bg-ink/5 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy"
          >
            <HelpCircle className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {listError ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-ember/20 bg-ember/5 py-12 text-center">
          <p className="text-sm text-ember">{listError}</p>
          <button
            type="button"
            onClick={() => void loadPage(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-ember/30 px-3 py-1.5 text-xs font-semibold text-ember hover:bg-ember/10"
          >
            <RefreshCcw className="h-3.5 w-3.5" aria-hidden="true" />
            Retry
          </button>
        </div>
      ) : (
        <>
          {loadingList && items.length === 0 ? (
            <div className="overflow-hidden rounded-2xl border border-ink/5 bg-white" aria-hidden="true">
              <div className="h-8 animate-pulse border-b border-ink/10 bg-mist/70" />
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex h-8 animate-pulse items-center gap-3 border-b border-ink/5 px-3">
                  <div className="h-3.5 w-3.5 rounded bg-ink/10" />
                  <div className="h-3 w-20 rounded bg-ink/10" />
                  <div className="h-3 max-w-xs flex-1 rounded bg-ink/5" />
                  <div className="ml-auto h-3 w-10 rounded bg-ink/10" />
                </div>
              ))}
            </div>
          ) : (
            <QueueList
              items={items}
              status={status}
              search={debouncedSearch}
              selectedId={selectedId}
              checkedIds={checkedIds}
              onSelect={setSelectedId}
              onToggleCheck={toggleCheck}
              onToggleCheckAll={toggleCheckAll}
              loading={loadingList}
            />
          )}

          {nextCursor && (
            <div className="flex justify-center">
              <button
                type="button"
                disabled={loadingList}
                onClick={() => void loadPage(false)}
                className="rounded-xl border border-ink/10 bg-white px-4 py-2 text-sm font-semibold text-ink/65 hover:bg-ink/5 disabled:opacity-60"
              >
                {loadingList ? "Loading…" : "Load more"}
              </button>
            </div>
          )}

          <BulkBar
            kind={kind}
            selectedCount={checkedIds.size}
            reasonCodes={reasonCodes}
            onClear={() => setCheckedIds(new Set())}
            onApprove={handleBulkApprove}
            onReject={handleBulkReject}
            lastResult={lastBulkResult}
            onDismissResult={() => setLastBulkResult(null)}
            confirmOpen={bulkConfirmOpen}
            onOpenConfirm={() => setBulkConfirmOpen(true)}
            onCloseConfirm={() => setBulkConfirmOpen(false)}
          />
        </>
      )}

      <ReviewPane
        ref={decisionFormRef}
        kind={kind}
        item={selectedItem}
        detail={activeDetail}
        loading={selectedId !== null && activeDetail === null && activeDetailError === null}
        error={activeDetailError}
        onRetry={() => setDetailReloadToken((t) => t + 1)}
        reasonCodes={reasonCodes}
        onDecide={handleDecide}
        decisionPending={decisionPendingId !== null}
      />

      <ShortcutSheet open={shortcutSheetOpen} onClose={() => setShortcutSheetOpen(false)} />

      <p className="text-center text-[11px] text-ink/35">
        {allChecked && items.length > 0 ? "All items on this page selected. " : ""}
        Items are shown risk-ranked, not by arrival time — do not expect chronological order.
      </p>
    </div>
  );
}
