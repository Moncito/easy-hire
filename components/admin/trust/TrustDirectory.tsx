"use client";

import { useEffect, useRef, useState } from "react";
import { RefreshCcw, ShieldAlert, ShieldCheck } from "lucide-react";
import DataTable, { type DataTableColumn } from "@/components/admin/directory/DataTable";
import { TrustScoreValue, formatDateTime } from "@/components/admin/directory/badges";
import { StatTile } from "@/components/admin/statTiles";
import TrustComponentChips from "./TrustComponentChips";
import { fetchTrustDirectoryPage } from "./api";
import type { SerializedTrustDirectoryRow, TrustDirectoryTargetType } from "./types";

/**
 * `/admin/trust` client shell — docs/ADMIN-CONSOLE-PLAN.md §4.8, §11 Phase 4
 * gate: "a risky account surfaces before a human reports it."
 *
 * Server component renders the first page (§5: "Server components for
 * reads") — this shell only re-fetches on a SEEKER/COMPANY switch or "load
 * more", same contract as UserDirectory.
 *
 * DELIBERATELY NO "SORT BY" CONTROL. lib/admin/trust-directory.ts's rows are
 * always lowest-score-first — that ordering IS the phase gate, not a UI
 * preference, so the only toggle here switches which population (seekers vs
 * companies) is being viewed, never how it's ordered.
 */

const TARGET_TABS: { value: TrustDirectoryTargetType; label: string }[] = [
  { value: "SEEKER", label: "Seekers" },
  { value: "COMPANY", label: "Companies" },
];

export type TrustDirectoryProps = {
  initialTargetType: TrustDirectoryTargetType;
  initialRows: SerializedTrustDirectoryRow[];
  initialNextCursor: string | null;
  initialScoredCount: number;
  initialNeverScoredCount: number;
  initialBelowThresholdCount: number;
};

export default function TrustDirectory({
  initialTargetType,
  initialRows,
  initialNextCursor,
  initialScoredCount,
  initialNeverScoredCount,
  initialBelowThresholdCount,
}: TrustDirectoryProps) {
  const [targetType, setTargetType] = useState<TrustDirectoryTargetType>(initialTargetType);
  const [rows, setRows] = useState<SerializedTrustDirectoryRow[]>(initialRows);
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor);
  const [scoredCount, setScoredCount] = useState(initialScoredCount);
  const [neverScoredCount, setNeverScoredCount] = useState(initialNeverScoredCount);
  const [belowThresholdCount, setBelowThresholdCount] = useState(initialBelowThresholdCount);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nextCursorRef = useRef<string | null>(initialNextCursor);
  const didMountRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    nextCursorRef.current = nextCursor;
  }, [nextCursor]);

  async function loadPage(reset: boolean, type: TrustDirectoryTargetType) {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    try {
      const res = await fetchTrustDirectoryPage(
        { type, cursor: reset ? undefined : nextCursorRef.current, limit: 25 },
        controller.signal
      );
      setRows((prev) => (reset ? res.rows : [...prev, ...res.rows]));
      setNextCursor(res.nextCursor);
      setScoredCount(res.scoredCount);
      setNeverScoredCount(res.neverScoredCount);
      setBelowThresholdCount(res.belowThresholdCount);
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      setError(e instanceof Error ? e.message : "Failed to load the trust directory.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    void loadPage(true, targetType);
  }, [targetType]);

  const columns: DataTableColumn<SerializedTrustDirectoryRow>[] = [
    {
      key: "account",
      header: targetType === "SEEKER" ? "Seeker" : "Company",
      render: (row) => (
        <div className="max-w-xs">
          <p className="truncate font-medium text-ink">{row.displayName}</p>
          <p className="truncate font-data text-[11px] text-ink/40">{row.id}</p>
        </div>
      ),
    },
    {
      key: "score",
      header: "Score",
      align: "right",
      render: (row) => <TrustScoreValue score={row.trustScore} />,
    },
    {
      key: "why",
      header: "Why",
      render: (row) =>
        row.trustSignals ? (
          <TrustComponentChips components={row.trustSignals.components} />
        ) : (
          <span className="text-[11px] text-ink/35">No breakdown stored for this score</span>
        ),
    },
    {
      key: "reports",
      header: "Open reports",
      align: "right",
      render: (row) =>
        row.openAbuseReportCount > 0 ? (
          <span
            className="inline-flex items-center gap-1 rounded-full bg-ember/10 px-2 py-0.5 font-data text-xs font-bold text-ember"
            title="Open abuse reports against this account — combined with a low score, this is the strongest signal on this screen."
          >
            <ShieldAlert className="h-3 w-3 shrink-0" aria-hidden="true" />
            {row.openAbuseReportCount}
          </span>
        ) : (
          <span className="font-data text-xs text-ink/35">0</span>
        ),
    },
    {
      key: "updated",
      header: "Last scored",
      align: "right",
      render: (row) => <span className="font-data text-xs text-ink/55">{formatDateTime(row.trustScoreUpdatedAt)}</span>,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile label="Scored accounts" value={scoredCount} />
        <StatTile label="Never scored" value={neverScoredCount} tone="muted" />
        <StatTile label="Below risk threshold" value={belowThresholdCount} tone="warn" />
      </div>
      <p className="flex items-start gap-1.5 text-xs text-ink/45">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink/30" aria-hidden="true" />
        <span>
          Accounts with no activity yet are <strong className="font-semibold text-ink/60">never scored</strong> and
          do not appear in the list below — see the &ldquo;Never scored&rdquo; count above; this table is not every
          account on the platform. The list is always ordered lowest score first with no alternate sort — that
          ordering is what lets a risky account surface before anyone reports it.
        </span>
      </p>

      <div className="inline-flex rounded-xl border border-ink/10 bg-white p-1">
        {TARGET_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            aria-pressed={targetType === tab.value}
            onClick={() => setTargetType(tab.value)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy ${
              targetType === tab.value ? "bg-navy text-white" : "text-ink/55 hover:bg-ink/5"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-ember/20 bg-ember/5 py-12 text-center">
          <p className="text-sm text-ember">{error}</p>
          <button
            type="button"
            onClick={() => void loadPage(true, targetType)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-ember/30 px-3 py-1.5 text-xs font-semibold text-ember hover:bg-ember/10"
          >
            <RefreshCcw className="h-3.5 w-3.5" aria-hidden="true" />
            Retry
          </button>
        </div>
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={rows}
            getRowId={(row) => row.id}
            getRowHref={(row) => (targetType === "SEEKER" ? `/admin/users/${row.userId}` : `/admin/companies/${row.id}`)}
            getRowAriaLabel={(row) => `Open the record for ${row.displayName}`}
            caption={`Trust directory: ${targetType === "SEEKER" ? "seekers" : "companies"}, lowest trust score first`}
            loading={loading}
            emptyState={
              <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-ink/5 bg-white py-16 text-center">
                <ShieldCheck className="h-6 w-6 text-ink/30" aria-hidden="true" />
                <p className="font-display text-base font-bold text-ink">No scored accounts yet</p>
                <p className="max-w-xs text-sm text-ink/50">
                  The nightly trust cron scores accounts with recent activity — check back once there&apos;s
                  traffic to score.
                </p>
              </div>
            }
          />

          {nextCursor && (
            <div className="flex justify-center">
              <button
                type="button"
                disabled={loading}
                onClick={() => void loadPage(false, targetType)}
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
