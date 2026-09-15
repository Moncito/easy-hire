"use client";

import { Flag, Pencil } from "lucide-react";
import DataTable, { type DataTableColumn } from "@/components/admin/directory/DataTable";
import { formatDateTime } from "@/components/admin/directory/badges";
import { EnabledPill, RolloutCell } from "./rolloutDisplay";
import type { SerializedFeatureFlag } from "./types";

/**
 * The dense feature-flags table — reuses the shared `DataTable`
 * (docs/ADMIN-CONSOLE-PLAN.md §9: "a single DataTable, not four bespoke
 * ones"), same convention as `AdminTeamTable`. `key` and the rollout
 * percentage are IBM Plex Mono (`font-data`) per CLAUDE.md — they are data.
 *
 * A viewer holding `system.read` but not `system.manage` sees every row and
 * every value exactly as a manager does — only the mutating "Edit" control is
 * disabled, with the reason as visible text tied to it via
 * `aria-describedby` (never a bare `title`), pointing at the one shared
 * reason paragraph the parent renders once for the whole screen rather than
 * repeating the sentence in every row.
 */

export type FeatureFlagsTableProps = {
  rows: SerializedFeatureFlag[];
  canManage: boolean;
  /** The `id` of the paragraph explaining why mutation is disabled, for `aria-describedby` — only present when `!canManage`. */
  readOnlyReasonId?: string;
  pendingKey: string | null;
  refreshing: boolean;
  onEdit: (row: SerializedFeatureFlag) => void;
};

export default function FeatureFlagsTable({ rows, canManage, readOnlyReasonId, pendingKey, refreshing, onEdit }: FeatureFlagsTableProps) {
  const columns: DataTableColumn<SerializedFeatureFlag>[] = [
    {
      key: "key",
      header: "Key",
      render: (row) => <span className="font-data text-xs font-semibold text-ink">{row.key}</span>,
    },
    {
      key: "description",
      header: "Description",
      render: (row) => <span className="block max-w-sm truncate text-xs text-ink/70">{row.description}</span>,
    },
    {
      key: "enabled",
      header: "Enabled",
      render: (row) => <EnabledPill enabled={row.enabled} />,
    },
    {
      key: "rollout",
      header: "Rollout",
      render: (row) => <RolloutCell enabled={row.enabled} rolloutPercentage={row.rolloutPercentage} />,
    },
    {
      key: "updatedBy",
      header: "Updated by",
      render: (row) => <span className="font-data text-[11px] text-ink/50">{row.updatedBy}</span>,
    },
    {
      key: "updatedAt",
      header: "Updated at",
      align: "right",
      render: (row) => <span className="font-data text-xs text-ink/55">{formatDateTime(row.updatedAt)}</span>,
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (row) => (
        <button
          type="button"
          disabled={!canManage || pendingKey === row.key || refreshing}
          aria-describedby={!canManage ? readOnlyReasonId : undefined}
          onClick={() => canManage && onEdit(row)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-ink/10 px-2.5 py-1 text-xs font-semibold text-ink/70 hover:bg-ink/5 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy"
        >
          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
          Edit
        </button>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={rows}
      getRowId={(row) => row.key}
      caption="Feature flags: key, description, enabled state, rollout percentage, and who last changed each one"
      maxHeightClassName="max-h-[70vh]"
      emptyState={
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-ink/5 bg-white py-16 text-center">
          <Flag className="h-6 w-6 text-ink/30" aria-hidden="true" />
          <p className="font-display text-base font-bold text-ink">No feature flags yet</p>
          <p className="max-w-xs text-sm text-ink/50">Flags created here appear immediately for anything that calls `isFeatureEnabled`.</p>
        </div>
      }
    />
  );
}
