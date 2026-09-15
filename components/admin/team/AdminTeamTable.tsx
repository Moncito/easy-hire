"use client";

import { AlertTriangle, ShieldCheck, UserPlus } from "lucide-react";
import DataTable, { type DataTableColumn } from "@/components/admin/directory/DataTable";
import { formatDate } from "@/components/admin/directory/badges";
import type { SerializedAdminTeamRow } from "./types";

/**
 * The dense admin-team table. Density per docs/ADMIN-CONSOLE-PLAN.md §5:
 * 32px rows (DataTable's `h-8`), IBM Plex Mono (`font-data`) for the level
 * and permission keys. Reuses the shared `DataTable` from the Phase 2
 * directory rather than a bespoke table, same §9 discipline ("a single
 * DataTable, not four bespoke ones") — no row-as-link here since "Manage" /
 * "Assign profile" open a modal, not a sub-page, so `getRowHref` is simply
 * omitted.
 *
 * "No profile row" is flagged in Ember — not decorative, it is the direct,
 * concrete consequence of the bootstrap-warning state (docs' own words: an
 * admin without a row "silently drops to SUPPORT when bootstrap ends... they
 * need to be obvious, not buried"). Icon + text always accompanies the
 * colour, never colour alone.
 */

export type AdminTeamTableProps = {
  rows: SerializedAdminTeamRow[];
  pendingUserId: string | null;
  refreshing: boolean;
  onManage: (row: SerializedAdminTeamRow) => void;
  onAssign: (row: SerializedAdminTeamRow) => void;
};

function PermissionPills({ permissions, tone }: { permissions: string[]; tone: "level" | "granted" }) {
  if (permissions.length === 0) {
    return <span className="text-[11px] text-ink/35">None</span>;
  }
  const cls = tone === "level" ? "bg-navy/8 text-navy" : "bg-teal/10 text-teal";
  return (
    <div className="flex flex-wrap gap-1">
      {permissions.map((p) => (
        <span key={p} className={`inline-flex items-center rounded-full px-1.5 py-0.5 font-data text-[10px] font-semibold ${cls}`}>
          {p}
        </span>
      ))}
    </div>
  );
}

export default function AdminTeamTable({ rows, pendingUserId, refreshing, onManage, onAssign }: AdminTeamTableProps) {
  const columns: DataTableColumn<SerializedAdminTeamRow>[] = [
    {
      key: "admin",
      header: "Admin",
      render: (row) => (
        <div className="max-w-xs">
          <p className="truncate font-medium text-ink">
            {row.email}
            {row.isSelf && <span className="ml-1.5 text-[10px] font-semibold uppercase tracking-wide text-navy/60">You</span>}
          </p>
          {!row.hasProfile && (
            <p className="mt-0.5 flex items-center gap-1 text-[11px] font-semibold text-ember">
              <AlertTriangle className="h-3 w-3 shrink-0" aria-hidden="true" />
              No profile row
            </p>
          )}
        </div>
      ),
    },
    {
      key: "level",
      header: "Level",
      render: (row) => (
        <div>
          <span className="font-data text-xs font-semibold text-ink">{row.resolvedLevel}</span>
          {row.resolvedLevel !== row.level && (
            <p className="mt-0.5 text-[10px] text-ink/45">
              stored: <span className="font-data">{row.level}</span>
            </p>
          )}
        </div>
      ),
    },
    {
      key: "permissions",
      header: "Effective permissions",
      render: (row) => (
        <div className="space-y-1 py-1">
          <PermissionPills permissions={row.levelDefaultPermissions} tone="level" />
          {row.grantedBeyondLevel.length > 0 && <PermissionPills permissions={row.grantedBeyondLevel} tone="granted" />}
        </div>
      ),
      cellClassName: "align-top",
    },
    {
      key: "updated",
      header: "Updated",
      align: "right",
      render: (row) => <span className="font-data text-xs text-ink/55">{formatDate(row.updatedAt)}</span>,
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (row) => (
        <button
          type="button"
          disabled={pendingUserId === row.userId || refreshing}
          onClick={() => (row.hasProfile ? onManage(row) : onAssign(row))}
          className="inline-flex items-center gap-1.5 rounded-lg border border-ink/10 px-2.5 py-1 text-xs font-semibold text-ink/70 hover:bg-ink/5 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy"
        >
          {row.hasProfile ? (
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
          ) : (
            <UserPlus className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          {row.hasProfile ? "Manage" : "Assign profile"}
        </button>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={rows}
      getRowId={(row) => row.userId}
      caption="Admin team: every Role.ADMIN account, its level, and its effective permissions"
      maxHeightClassName="max-h-[70vh]"
      emptyState={
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-ink/5 bg-white py-16 text-center">
          <ShieldCheck className="h-6 w-6 text-ink/30" aria-hidden="true" />
          <p className="font-display text-base font-bold text-ink">No admin accounts yet</p>
          <p className="max-w-xs text-sm text-ink/50">Role.ADMIN users will appear here once they sign up or are promoted.</p>
        </div>
      }
    />
  );
}
