"use client";

import { EyeOff } from "lucide-react";
import DataTable, { type DataTableColumn } from "@/components/admin/directory/DataTable";
import type { SerializedAdminAuditLog } from "./types";

/**
 * Dense audit table — docs/ADMIN-CONSOLE-PLAN.md §4.9/§8.3: "density over
 * decoration." Reuses the shared `DataTable` (32px rows, font-data for
 * ids/timestamps) rather than a card-per-row layout, per the task spec.
 *
 * No `getRowHref` — unlike the directory tables, an audit row has no single
 * detail page of its own; it IS the detail (the append-only compliance
 * record), so there's nowhere further to click through to.
 */

function actionLabel(action: string): string {
  return action
    .toLowerCase()
    .split("_")
    .map((w) => (w[0] ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });
}

/** `before`/`after` are always small status-transition snapshots (see RecordAdminActionInput's doc comment in lib/admin/audit.ts) — a compact "key: before -> after" line per changed key, not a raw JSON dump. */
function diffEntries(before: Record<string, unknown> | null, after: Record<string, unknown> | null): string[] {
  if (!before && !after) return [];
  const keys = new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})]);
  const entries: string[] = [];
  for (const key of keys) {
    const b = before?.[key];
    const a = after?.[key];
    if (JSON.stringify(b) === JSON.stringify(a)) continue;
    entries.push(`${key}: ${b === undefined ? "—" : String(b)} → ${a === undefined ? "—" : String(a)}`);
  }
  return entries;
}

export type AuditLogTableProps = {
  logs: SerializedAdminAuditLog[];
  loading: boolean;
};

export default function AuditLogTable({ logs, loading }: AuditLogTableProps) {
  const columns: DataTableColumn<SerializedAdminAuditLog>[] = [
    {
      key: "when",
      header: "When",
      render: (row) => (
        <span className="whitespace-nowrap font-data text-xs text-ink/70 admin-dark:text-mist/70">
          {formatTimestamp(row.createdAt)}
        </span>
      ),
    },
    {
      key: "admin",
      header: "Admin",
      render: (row) => (
        <div className="max-w-[10rem]">
          <p className="truncate font-data text-xs text-ink/70 admin-dark:text-mist/70" title={row.adminUserId}>
            {row.adminUserId}
          </p>
          {row.impersonationSessionId && (
            <span
              className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-ember/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ember admin-dark:bg-ember/15"
              title={`Taken during impersonation session ${row.impersonationSessionId} — this admin was viewing as another account, not acting as themselves.`}
            >
              <EyeOff className="h-2.5 w-2.5 shrink-0" aria-hidden="true" />
              Impersonated
            </span>
          )}
        </div>
      ),
    },
    {
      key: "action",
      header: "Action",
      render: (row) => (
        <span className="text-xs font-semibold text-ink admin-dark:text-mist">{actionLabel(row.action)}</span>
      ),
    },
    {
      key: "target",
      header: "Target",
      render: (row) => (
        <div className="max-w-[12rem]">
          <p className="truncate text-xs font-medium text-ink/70 admin-dark:text-mist/70">{row.targetType}</p>
          <p className="truncate font-data text-[11px] text-ink/40 admin-dark:text-mist/40" title={row.targetId}>
            {row.targetId}
          </p>
        </div>
      ),
    },
    {
      key: "reason",
      header: "Reason / note",
      render: (row) => {
        if (!row.reasonCode && !row.note)
          return <span className="text-[11px] text-ink/35 admin-dark:text-mist/35">—</span>;
        return (
          <div className="max-w-[14rem]">
            {row.reasonCode && (
              <p className="truncate text-xs font-semibold text-ink/70 admin-dark:text-mist/70">
                {actionLabel(row.reasonCode)}
              </p>
            )}
            {row.note && (
              <p className="truncate text-[11px] text-ink/45 admin-dark:text-mist/45" title={row.note}>
                {row.note}
              </p>
            )}
          </div>
        );
      },
    },
    {
      key: "change",
      header: "Change",
      render: (row) => {
        const entries = diffEntries(row.before, row.after);
        if (entries.length === 0) return <span className="text-[11px] text-ink/35 admin-dark:text-mist/35">—</span>;
        return (
          <p
            className="max-w-[16rem] truncate font-data text-[11px] text-ink/55 admin-dark:text-mist/55"
            title={entries.join(", ")}
          >
            {entries.join(", ")}
          </p>
        );
      },
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={logs}
      getRowId={(row) => row.id}
      caption="Admin audit log: every admin action, most recent first"
      loading={loading}
      emptyState={
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-ink/5 bg-white py-16 text-center admin-dark:border-white/10 admin-dark:bg-admin-dark-surface">
          <p className="font-display text-base font-bold text-ink admin-dark:text-mist">No matching audit entries</p>
          <p className="max-w-xs text-sm text-ink/50 admin-dark:text-mist/50">Try widening the filters or the date range.</p>
        </div>
      }
    />
  );
}
