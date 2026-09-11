"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, UserPlus } from "lucide-react";
import AdminTeamTable from "./AdminTeamTable";
import AdminProfileEditor from "./AdminProfileEditor";
import CreateAdminProfileForm from "./CreateAdminProfileForm";
import { createAdminTeamProfile, revokeAdminTeamProfile, updateAdminTeamProfile } from "./api";
import type { AdminLevel, AdminPermission, SerializedAdminTeamRow } from "./types";

/**
 * Client shell for `/admin/system/team` — mutations against
 * `/api/admin/team[/​[id]]`; the first paint comes from the server component
 * (docs/ADMIN-CONSOLE-PLAN.md §5: "Server components for reads").
 *
 * Mutation → refresh, not a hand-rolled client copy of the resolution logic.
 * `lib/admin/permissions.ts`'s `resolveAdminAccess` / `defaultPermissionsForLevel`
 * are what computed `effectivePermissions` / `levelDefaultPermissions` /
 * `isLastSuperAdmin` for every row server-side, and one mutation here can
 * change what ALL of that means for OTHER rows too — e.g. creating the first
 * profile flips `isBootstrap` for the whole table, and demoting the only
 * other SUPER_ADMIN changes who else is now "the last one." Re-deriving that
 * client-side would mean either importing `/lib` into a client component (the
 * one thing this task explicitly rules out for the sidebar, and the same
 * reasoning applies here) or maintaining a second, driftable copy of the same
 * rules. Instead: a raw-field optimistic patch (level / permissions / hasProfile
 * — exactly what the mutation response hands back) for immediate feedback on
 * the row acted on, then `router.refresh()` inside `startTransition` to pull
 * the authoritative, fully-recomputed table. `isPending` (real React state
 * from `useTransition`, not a hand-synced copy of a prop) drives the
 * "recalculating" affordance while that refresh is in flight — never a
 * `useEffect` mirroring `rows` into local state.
 *
 * Known limitation, not hidden: the optimistic patch for a row persists until
 * something next mutates that same row from this screen. If a second admin
 * changes the same row from another session in between, this tab shows the
 * patch (stale) until a manual reload. Acceptable for a small, low-concurrency
 * internal screen; called out here and in the task report rather than papered
 * over.
 */

export type AdminTeamManagerProps = {
  rows: SerializedAdminTeamRow[];
  isBootstrap: boolean;
  viewerUserId: string;
};

type OptimisticPatch = { level?: AdminLevel; rawPermissions?: AdminPermission[]; hasProfile?: boolean };

export default function AdminTeamManager({ rows, isBootstrap, viewerUserId }: AdminTeamManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [patches, setPatches] = useState<Record<string, OptimisticPatch>>({});
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [announce, setAnnounce] = useState("");
  const [editingRow, setEditingRow] = useState<SerializedAdminTeamRow | null>(null);
  const [creatingFor, setCreatingFor] = useState<SerializedAdminTeamRow | "new" | null>(null);

  const displayRows = rows.map((r) => {
    const patch = patches[r.userId];
    if (!patch) return r;
    return {
      ...r,
      level: patch.level ?? r.level,
      rawPermissions: patch.rawPermissions ?? r.rawPermissions,
      hasProfile: patch.hasProfile ?? r.hasProfile,
    };
  });

  const eligibleForCreate = displayRows.filter((r) => !r.hasProfile);

  function refresh() {
    startTransition(() => {
      router.refresh();
    });
  }

  async function handleSave(
    row: SerializedAdminTeamRow,
    input: { level: AdminLevel; permissions: AdminPermission[] }
  ): Promise<{ ok: boolean; error?: string }> {
    setPendingUserId(row.userId);
    const res = await updateAdminTeamProfile(row.userId, input);
    setPendingUserId(null);
    if (!res.ok) {
      setAnnounce(`Could not update ${row.email}: ${res.error}`);
      return { ok: false, error: res.error };
    }
    setPatches((p) => ({
      ...p,
      [row.userId]: { level: res.data.level, rawPermissions: res.data.permissions as AdminPermission[], hasProfile: true },
    }));
    setAnnounce(`Updated ${row.email}.`);
    setEditingRow(null);
    refresh();
    return { ok: true };
  }

  async function handleRevoke(row: SerializedAdminTeamRow): Promise<{ ok: boolean; error?: string }> {
    setPendingUserId(row.userId);
    const res = await revokeAdminTeamProfile(row.userId);
    setPendingUserId(null);
    if (!res.ok) {
      setAnnounce(`Could not revoke ${row.email}: ${res.error}`);
      return { ok: false, error: res.error };
    }
    setPatches((p) => ({ ...p, [row.userId]: { hasProfile: false, rawPermissions: [] } }));
    setAnnounce(`Revoked ${row.email}'s admin profile — they now resolve to SUPPORT.`);
    setEditingRow(null);
    refresh();
    return { ok: true };
  }

  async function handleCreate(input: {
    userId: string;
    level: AdminLevel;
    permissions: AdminPermission[];
  }): Promise<{ ok: boolean; error?: string }> {
    setPendingUserId(input.userId);
    const res = await createAdminTeamProfile(input);
    setPendingUserId(null);
    if (!res.ok) {
      setAnnounce(`Could not create the profile: ${res.error}`);
      return { ok: false, error: res.error };
    }
    setPatches((p) => ({
      ...p,
      [input.userId]: { level: res.data.level, rawPermissions: res.data.permissions as AdminPermission[], hasProfile: true },
    }));
    setAnnounce(`Created an admin profile for ${res.data.email}.`);
    setCreatingFor(null);
    refresh();
    return { ok: true };
  }

  const editingRowLive = editingRow
    ? (displayRows.find((r) => r.userId === editingRow.userId) ?? editingRow)
    : null;

  return (
    <div className="space-y-5">
      <div aria-live="polite" role="status" className="sr-only">
        {announce}
      </div>
      {announce && (
        <p className="rounded-xl border border-ink/10 bg-white px-3 py-2 text-xs font-medium text-ink/70">{announce}</p>
      )}

      {isBootstrap && (
        <div role="alert" className="flex items-start gap-3 rounded-2xl border border-ember/30 bg-ember/5 p-4">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-ember" aria-hidden="true" />
          <div>
            <p className="font-display text-sm font-bold text-ember">Bootstrap mode — no admin profiles exist yet</p>
            <p className="mt-1 text-sm text-ink/70">
              Every admin currently acts as SUPER_ADMIN because there is nothing on record to say otherwise. The
              moment the first profile is created, bootstrap ends for everyone: any admin still without a profile row
              immediately drops to SUPPORT. Create your own profile first if you don&rsquo;t want to be the one who
              drops.
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-ink/55">
          {rows.length} admin{rows.length === 1 ? "" : "s"} —{" "}
          {rows.filter((r) => r.hasProfile).length} with a profile, {rows.filter((r) => !r.hasProfile).length} without.
        </p>
        <button
          type="button"
          onClick={() => setCreatingFor("new")}
          disabled={eligibleForCreate.length === 0}
          className="inline-flex items-center gap-1.5 rounded-xl bg-navy px-3.5 py-2 text-sm font-semibold text-white hover:bg-navy/90 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2"
        >
          <UserPlus className="h-4 w-4" aria-hidden="true" />
          Assign a profile
        </button>
      </div>

      <div aria-busy={isPending}>
        {isPending && (
          <p className="mb-2 text-xs font-medium text-ink/45" aria-hidden="true">
            Recalculating team access…
          </p>
        )}
        <AdminTeamTable
          rows={displayRows}
          pendingUserId={pendingUserId}
          refreshing={isPending}
          onManage={(row) => setEditingRow(row)}
          onAssign={(row) => setCreatingFor(row)}
        />
      </div>

      {editingRowLive && (
        <AdminProfileEditor
          row={editingRowLive}
          onClose={() => setEditingRow(null)}
          onSave={(input) => handleSave(editingRowLive, input)}
          onRevoke={() => handleRevoke(editingRowLive)}
        />
      )}

      {creatingFor && (
        <CreateAdminProfileForm
          isBootstrap={isBootstrap}
          viewerUserId={viewerUserId}
          eligibleUsers={eligibleForCreate.map((r) => ({ userId: r.userId, email: r.email }))}
          initialUserId={creatingFor === "new" ? undefined : creatingFor.userId}
          onClose={() => setCreatingFor(null)}
          onSubmit={handleCreate}
        />
      )}
    </div>
  );
}
