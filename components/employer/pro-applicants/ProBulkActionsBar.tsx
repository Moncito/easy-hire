"use client";

import { X } from "lucide-react";
import { Button } from "@/components/employer/system";
import { STAGE_OPTIONS } from "@/components/employer/BulkApplicantActionsBar";

/**
 * Bulk actions for selected candidates: move to a stage, or reject (which
 * opens the same confirmation as a single rejection). Same callbacks as
 * the shared BulkApplicantActionsBar.
 */
export default function ProBulkActionsBar({
  selectedCount,
  loading = false,
  onClear,
  onMove,
  onReject,
}: {
  selectedCount: number;
  loading?: boolean;
  onClear: () => void;
  onMove: (status: string) => void;
  onReject: () => void;
}) {
  if (selectedCount === 0) return null;

  return (
    <div
      role="region"
      aria-label="Bulk actions"
      className="mb-4 flex flex-wrap items-center gap-2 rounded-card border border-[color-mix(in_srgb,var(--eh-marigold)_45%,var(--eh-line))] bg-eh-marigold-tint px-4 py-2.5 shadow-eh-sm"
    >
      <span className="num mr-2 text-ui font-semibold text-eh-ink" aria-live="polite">
        {selectedCount} {selectedCount === 1 ? "candidate" : "candidates"} selected
      </span>
      <select
        disabled={loading}
        defaultValue=""
        onChange={(e) => {
          if (e.target.value) {
            onMove(e.target.value);
            e.target.value = "";
          }
        }}
        aria-label="Move selected to stage"
        className="h-8 rounded-control border border-eh-line bg-eh-surface px-2.5 text-ui text-eh-ink disabled:opacity-50"
      >
        <option value="" disabled>
          Move to stage…
        </option>
        {STAGE_OPTIONS.filter((o) => o.value !== "REJECTED").map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <Button size="sm" variant="destructive" icon={<X />} onClick={onReject} disabled={loading}>
        Reject selected
      </Button>
      <Button size="sm" variant="ghost" onClick={onClear} disabled={loading} className="ml-auto">
        Clear selection
      </Button>
    </div>
  );
}
