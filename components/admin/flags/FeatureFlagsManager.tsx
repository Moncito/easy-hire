"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Info, Plus } from "lucide-react";
import FeatureFlagsTable from "./FeatureFlagsTable";
import FeatureFlagEditor from "./FeatureFlagEditor";
import CreateFeatureFlagForm from "./CreateFeatureFlagForm";
import { createFeatureFlag, deleteFeatureFlag, updateFeatureFlag } from "./api";
import type { SerializedFeatureFlag } from "./types";

/**
 * Client shell for `/admin/system/flags` — mutations against
 * `/api/admin/feature-flags[/​[key]]`; the first paint comes from the server
 * component (§5: "server components for reads"). Same
 * optimistic-patch-then-`router.refresh()` shape as `AdminTeamManager`: a raw
 * field patch (exactly what the mutation response hands back) for immediate
 * feedback, then a refresh for the authoritative list.
 *
 * `canManage` (`system.manage`) is a prop computed server-side by the page
 * from `hasPermission(ctx.access, "system.manage")` — this component never
 * re-derives it. A viewer with `system.read` but not `system.manage` gets the
 * full, real list and every value exactly as a manager sees it; only the
 * "Create flag" button and every row's "Edit" control are disabled, each with
 * the SAME single reason paragraph tied to it via `aria-describedby` (never a
 * bare `title`, never an error toast after the fact — the refusal is visible
 * before the click, not after).
 */

export type FeatureFlagsManagerProps = {
  rows: SerializedFeatureFlag[];
  canManage: boolean;
};

const READONLY_REASON_ID = "flags-readonly-reason";

export default function FeatureFlagsManager({ rows, canManage }: FeatureFlagsManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [patches, setPatches] = useState<Record<string, Partial<SerializedFeatureFlag>>>({});
  const [removedKeys, setRemovedKeys] = useState<Set<string>>(new Set());
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [announce, setAnnounce] = useState("");
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const displayRows = rows
    .filter((r) => !removedKeys.has(r.key))
    .map((r) => {
      const patch = patches[r.key];
      return patch ? { ...r, ...patch } : r;
    });

  const editingRow = editingKey ? (displayRows.find((r) => r.key === editingKey) ?? null) : null;

  function refresh() {
    startTransition(() => {
      router.refresh();
    });
  }

  async function handleSave(
    row: SerializedFeatureFlag,
    input: { description: string; enabled: boolean; rolloutPercentage: number | null }
  ): Promise<{ ok: boolean; error?: string }> {
    setPendingKey(row.key);
    const res = await updateFeatureFlag(row.key, input);
    setPendingKey(null);
    if (!res.ok) {
      setAnnounce(`Could not update ${row.key}: ${res.error}`);
      return { ok: false, error: res.error };
    }
    setPatches((p) => ({
      ...p,
      [row.key]: {
        description: res.data.description,
        enabled: res.data.enabled,
        rolloutPercentage: res.data.rolloutPercentage,
        updatedBy: res.data.updatedBy,
        updatedAt: res.data.updatedAt,
      },
    }));
    setAnnounce(`Updated ${row.key}.`);
    setEditingKey(null);
    refresh();
    return { ok: true };
  }

  async function handleDelete(row: SerializedFeatureFlag): Promise<{ ok: boolean; error?: string }> {
    setPendingKey(row.key);
    const res = await deleteFeatureFlag(row.key);
    setPendingKey(null);
    if (!res.ok) {
      setAnnounce(`Could not delete ${row.key}: ${res.error}`);
      return { ok: false, error: res.error };
    }
    setRemovedKeys((prev) => new Set(prev).add(row.key));
    setAnnounce(`Deleted ${row.key}.`);
    setEditingKey(null);
    refresh();
    return { ok: true };
  }

  async function handleCreate(input: {
    key: string;
    description: string;
    enabled: boolean;
    rolloutPercentage: number | null;
  }): Promise<{ ok: boolean; error?: string }> {
    setPendingKey(input.key);
    const res = await createFeatureFlag(input);
    setPendingKey(null);
    if (!res.ok) {
      setAnnounce(`Could not create ${input.key}: ${res.error}`);
      return { ok: false, error: res.error };
    }
    setCreating(false);
    setAnnounce(`Created ${res.data.key}.`);
    refresh();
    return { ok: true };
  }

  return (
    <div className="space-y-5">
      <div aria-live="polite" role="status" className="sr-only">
        {announce}
      </div>
      {announce && (
        <p className="rounded-xl border border-ink/10 bg-white px-3 py-2 text-xs font-medium text-ink/70">{announce}</p>
      )}

      {!canManage && (
        <p
          id={READONLY_REASON_ID}
          role="note"
          className="flex items-start gap-2.5 rounded-2xl border border-navy/15 bg-navy/5 px-4 py-3 text-sm text-navy"
        >
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          You can see every flag, but you hold <span className="font-data">system.read</span> without{" "}
          <span className="font-data">system.manage</span> — creating, editing, and deleting flags is turned off for
          your account. Ask a SUPER_ADMIN or FINANCE-adjacent admin with <span className="font-data">system.manage</span>{" "}
          to make changes.
        </p>
      )}

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-ink/55">
          {rows.length - removedKeys.size} flag{rows.length - removedKeys.size === 1 ? "" : "s"}
        </p>
        <button
          type="button"
          disabled={!canManage}
          aria-describedby={!canManage ? READONLY_REASON_ID : undefined}
          onClick={() => canManage && setCreating(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-navy px-3.5 py-2 text-sm font-semibold text-white hover:bg-navy/90 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Create flag
        </button>
      </div>

      <div aria-busy={isPending}>
        {isPending && (
          <p className="mb-2 text-xs font-medium text-ink/45" aria-hidden="true">
            Refreshing…
          </p>
        )}
        <FeatureFlagsTable
          rows={displayRows}
          canManage={canManage}
          readOnlyReasonId={!canManage ? READONLY_REASON_ID : undefined}
          pendingKey={pendingKey}
          refreshing={isPending}
          onEdit={(row) => setEditingKey(row.key)}
        />
      </div>

      {editingRow && (
        <FeatureFlagEditor
          row={editingRow}
          onClose={() => setEditingKey(null)}
          onSave={(input) => handleSave(editingRow, input)}
          onDelete={() => handleDelete(editingRow)}
        />
      )}

      {creating && <CreateFeatureFlagForm onClose={() => setCreating(false)} onSubmit={handleCreate} />}
    </div>
  );
}
