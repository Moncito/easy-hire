"use client";

import { useRef, useState } from "react";
import { RefreshCcw } from "lucide-react";
import AuditFilterBar from "./AuditFilterBar";
import AuditLogTable from "./AuditLogTable";
import { fetchAuditLogPage } from "./api";
import type { AuditLogFilters, SerializedAdminAuditLog } from "./types";

/**
 * `/admin/audit` client shell — filter bar + dense table + cursor "load
 * more", same shape as UserDirectory/TrustDirectory. Server component
 * renders the first (unfiltered) page; every filter change re-fetches from
 * scratch (`reset: true`), "load more" keeps the current filters and pages
 * forward on the (createdAt, id) cursor.
 */

export type AuditLogDirectoryProps = {
  actions: string[];
  initialLogs: SerializedAdminAuditLog[];
  initialNextCursor: string | null;
};

export default function AuditLogDirectory({ actions, initialLogs, initialNextCursor }: AuditLogDirectoryProps) {
  const [filters, setFilters] = useState<AuditLogFilters>({});
  const [logs, setLogs] = useState<SerializedAdminAuditLog[]>(initialLogs);
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nextCursorRef = useRef<string | null>(initialNextCursor);
  const abortRef = useRef<AbortController | null>(null);

  async function loadPage(reset: boolean, appliedFilters: AuditLogFilters) {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    try {
      const res = await fetchAuditLogPage(
        { ...appliedFilters, cursor: reset ? undefined : nextCursorRef.current, limit: 50 },
        controller.signal
      );
      setLogs((prev) => (reset ? res.logs : [...prev, ...res.logs]));
      setNextCursor(res.nextCursor);
      nextCursorRef.current = res.nextCursor;
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      setError(e instanceof Error ? e.message : "Failed to load the audit log.");
    } finally {
      setLoading(false);
    }
  }

  function handleApply(next: AuditLogFilters) {
    setFilters(next);
    void loadPage(true, next);
  }

  return (
    <div className="space-y-4">
      <AuditFilterBar actions={actions} value={filters} onApply={handleApply} loading={loading} />

      {error ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-ember/20 bg-ember/5 py-12 text-center">
          <p className="text-sm text-ember">{error}</p>
          <button
            type="button"
            onClick={() => void loadPage(true, filters)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-ember/30 px-3 py-1.5 text-xs font-semibold text-ember hover:bg-ember/10"
          >
            <RefreshCcw className="h-3.5 w-3.5" aria-hidden="true" />
            Retry
          </button>
        </div>
      ) : (
        <>
          <AuditLogTable logs={logs} loading={loading} />

          {nextCursor && (
            <div className="flex justify-center">
              <button
                type="button"
                disabled={loading}
                onClick={() => void loadPage(false, filters)}
                className="rounded-xl border border-ink/10 bg-white px-4 py-2 text-sm font-semibold text-ink/65 hover:bg-ink/5 disabled:opacity-60"
              >
                {loading ? "Loading…" : "Load more"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
