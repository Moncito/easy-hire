"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { Filter, RotateCcw } from "lucide-react";
import AdminSelect from "@/components/admin/ui/Select";
import type { AuditLogFilters } from "./types";

/**
 * Filter bar for `/admin/audit` — docs/ADMIN-CONSOLE-PLAN.md §4.9: "Filters:
 * by admin, by action, by target, by date range — a filter bar, not a
 * search box," since every one of these is an exact-match or range filter
 * against a controlled vocabulary (`action`), never free text.
 *
 * Staged locally and applied on submit (rather than firing a request per
 * keystroke like the directory's debounced search) — an id/date filter
 * mid-typing has no useful partial-match meaning the way a name search does.
 */

function actionLabel(action: string): string {
  return action
    .toLowerCase()
    .split("_")
    .map((w) => (w[0] ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

export type AuditFilterBarProps = {
  actions: string[];
  value: AuditLogFilters;
  onApply: (filters: AuditLogFilters) => void;
  loading: boolean;
};

export default function AuditFilterBar({ actions, value, onApply, loading }: AuditFilterBarProps) {
  const [draft, setDraft] = useState<AuditLogFilters>(value);
  const actionOptions = [{ value: "", label: "Any action" }, ...actions.map((a) => ({ value: a, label: actionLabel(a) }))];

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onApply(draft);
  }

  function handleClear() {
    const cleared: AuditLogFilters = {};
    setDraft(cleared);
    onApply(cleared);
  }

  const hasDraftFilters = Object.values(draft).some((v) => v !== undefined && v !== "");

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-wrap items-end gap-3 rounded-2xl border border-ink/10 bg-white p-4 admin-dark:border-white/10 admin-dark:bg-admin-dark-surface"
      aria-label="Filter the audit log"
    >
      <div className="flex flex-col gap-1">
        <label
          htmlFor="audit-filter-admin"
          className="text-[10px] font-bold uppercase tracking-wider text-ink/45 admin-dark:text-mist/45"
        >
          Admin (user id)
        </label>
        <input
          id="audit-filter-admin"
          type="text"
          value={draft.adminUserId ?? ""}
          onChange={(e) => setDraft((d) => ({ ...d, adminUserId: e.target.value || undefined }))}
          placeholder="Exact user id…"
          className="w-40 rounded-lg border border-ink/10 px-2.5 py-1.5 font-data text-xs outline-none focus:border-navy focus:ring-2 focus:ring-navy/20 admin-dark:border-white/15 admin-dark:bg-white/5 admin-dark:text-mist admin-dark:placeholder:text-mist/40 admin-dark:focus:border-teal admin-dark:focus:ring-teal/20"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="audit-filter-action"
          className="text-[10px] font-bold uppercase tracking-wider text-ink/45 admin-dark:text-mist/45"
        >
          Action
        </label>
        <div className="w-48">
          <AdminSelect
            id="audit-filter-action"
            aria-label="Filter by action"
            value={draft.action ?? ""}
            onChange={(value) => setDraft((d) => ({ ...d, action: value || undefined }))}
            options={actionOptions}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="audit-filter-target-type"
          className="text-[10px] font-bold uppercase tracking-wider text-ink/45 admin-dark:text-mist/45"
        >
          Target type
        </label>
        <input
          id="audit-filter-target-type"
          type="text"
          value={draft.targetType ?? ""}
          onChange={(e) => setDraft((d) => ({ ...d, targetType: e.target.value || undefined }))}
          placeholder="e.g. COMPANY"
          className="w-32 rounded-lg border border-ink/10 px-2.5 py-1.5 font-data text-xs outline-none focus:border-navy focus:ring-2 focus:ring-navy/20 admin-dark:border-white/15 admin-dark:bg-white/5 admin-dark:text-mist admin-dark:placeholder:text-mist/40 admin-dark:focus:border-teal admin-dark:focus:ring-teal/20"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="audit-filter-target-id"
          className="text-[10px] font-bold uppercase tracking-wider text-ink/45 admin-dark:text-mist/45"
        >
          Target id
        </label>
        <input
          id="audit-filter-target-id"
          type="text"
          value={draft.targetId ?? ""}
          onChange={(e) => setDraft((d) => ({ ...d, targetId: e.target.value || undefined }))}
          placeholder="Exact target id…"
          className="w-40 rounded-lg border border-ink/10 px-2.5 py-1.5 font-data text-xs outline-none focus:border-navy focus:ring-2 focus:ring-navy/20 admin-dark:border-white/15 admin-dark:bg-white/5 admin-dark:text-mist admin-dark:placeholder:text-mist/40 admin-dark:focus:border-teal admin-dark:focus:ring-teal/20"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="audit-filter-since"
          className="text-[10px] font-bold uppercase tracking-wider text-ink/45 admin-dark:text-mist/45"
        >
          Since
        </label>
        <input
          id="audit-filter-since"
          type="date"
          value={draft.since ?? ""}
          onChange={(e) => setDraft((d) => ({ ...d, since: e.target.value || undefined }))}
          className="rounded-lg border border-ink/10 px-2.5 py-1.5 font-data text-xs outline-none focus:border-navy focus:ring-2 focus:ring-navy/20 admin-dark:border-white/15 admin-dark:bg-white/5 admin-dark:text-mist admin-dark:[color-scheme:dark] admin-dark:focus:border-teal admin-dark:focus:ring-teal/20"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="audit-filter-until"
          className="text-[10px] font-bold uppercase tracking-wider text-ink/45 admin-dark:text-mist/45"
        >
          Until
        </label>
        <input
          id="audit-filter-until"
          type="date"
          value={draft.until ?? ""}
          onChange={(e) => setDraft((d) => ({ ...d, until: e.target.value || undefined }))}
          className="rounded-lg border border-ink/10 px-2.5 py-1.5 font-data text-xs outline-none focus:border-navy focus:ring-2 focus:ring-navy/20 admin-dark:border-white/15 admin-dark:bg-white/5 admin-dark:text-mist admin-dark:[color-scheme:dark] admin-dark:focus:border-teal admin-dark:focus:ring-teal/20"
        />
      </div>

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-lg bg-navy px-3 py-1.5 text-xs font-semibold text-white hover:bg-navy/90 disabled:opacity-60 admin-dark:bg-teal admin-dark:hover:bg-teal/90"
        >
          <Filter className="h-3.5 w-3.5" aria-hidden="true" />
          Apply
        </button>
        {hasDraftFilters && (
          <button
            type="button"
            onClick={handleClear}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-ink/10 px-3 py-1.5 text-xs font-semibold text-ink/60 hover:bg-ink/5 disabled:opacity-60 admin-dark:border-white/10 admin-dark:text-mist/60 admin-dark:hover:bg-white/5"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            Clear
          </button>
        )}
      </div>
    </form>
  );
}
