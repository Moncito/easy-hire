"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, ShieldAlert, X } from "lucide-react";
import { ADMIN_PERMISSION_ORDER, PERMISSION_META } from "./permissionMeta";
import { ADMIN_LEVELS, type AdminLevel, type AdminPermission } from "./types";

/**
 * Assign a fresh `AdminProfile` to a `Role.ADMIN` user who doesn't have one
 * yet — the target picker is built from `listAdminTeam`'s profile-less rows
 * only (docs/ADMIN-CONSOLE-PLAN.md §6.7), so this never offers a target that
 * is guaranteed to 409 with "already has an admin profile."
 *
 * Bootstrap mode (§6.7 task note) gets the loudest treatment on this screen:
 * creating the FIRST profile anywhere ends bootstrap for every admin, not
 * just the one being assigned. That has to be said before the click, not
 * after — hence the banner up top, repeated as a short line by the submit
 * button itself.
 *
 * The one narrow exception the backend allows — a bootstrap operator
 * creating their OWN row at SUPER_ADMIN (`allowBootstrapSelfInit` in
 * lib/admin/permissions.ts) — is surfaced by locking the level to
 * SUPER_ADMIN and explaining why, rather than letting the operator pick
 * something else and hit a 403 they don't understand. Assigning anyone
 * else's row to yourself outside bootstrap is still refused server-side
 * (self-escalation), so that combination disables the submit button here too
 * — a defensive guard: the picker is built from a prop that can be one
 * `router.refresh()` behind reality, so this exact combination should be
 * unreachable in practice, not merely unchecked.
 */

export type CreateAdminProfileFormProps = {
  isBootstrap: boolean;
  viewerUserId: string;
  eligibleUsers: { userId: string; email: string }[];
  initialUserId?: string;
  onClose: () => void;
  onSubmit: (input: { userId: string; level: AdminLevel; permissions: AdminPermission[] }) => Promise<{ ok: boolean; error?: string }>;
};

export default function CreateAdminProfileForm({
  isBootstrap,
  viewerUserId,
  eligibleUsers,
  initialUserId,
  onClose,
  onSubmit,
}: CreateAdminProfileFormProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const triggerElement = document.activeElement;
    const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
      'button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    focusable?.[0]?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === "Tab" && dialogRef.current) {
        const items = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (items.length === 0) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      if (triggerElement instanceof HTMLElement) triggerElement.focus();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [userId, setUserId] = useState(initialUserId ?? eligibleUsers[0]?.userId ?? "");
  const isSelfTarget = userId === viewerUserId;
  const selfBootstrapInit = isBootstrap && isSelfTarget;
  const selfBlockedOutsideBootstrap = !isBootstrap && isSelfTarget;

  const [level, setLevel] = useState<AdminLevel>(selfBootstrapInit ? "SUPER_ADMIN" : "SUPPORT");
  const [permissions, setPermissions] = useState<Set<AdminPermission>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleUserChange(next: string) {
    setUserId(next);
    if (isBootstrap && next === viewerUserId) setLevel("SUPER_ADMIN");
  }

  function togglePermission(p: AdminPermission) {
    setPermissions((prev) => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p);
      else next.add(p);
      return next;
    });
  }

  async function handleSubmit() {
    if (!userId || selfBlockedOutsideBootstrap) return;
    setError(null);
    setSubmitting(true);
    const res = await onSubmit({ userId, level, permissions: Array.from(permissions) });
    setSubmitting(false);
    if (!res.ok) setError(res.error ?? "Could not create the admin profile.");
  }

  const targetEmail = eligibleUsers.find((u) => u.userId === userId)?.email ?? "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4" onClick={onClose}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-profile-title"
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-ink/10 bg-white p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 id="create-profile-title" className="font-display text-lg font-bold text-ink">
            Assign an admin profile
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-ink/40 hover:bg-ink/5 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {isBootstrap && (
          <div role="alert" className="mb-4 flex items-start gap-2.5 rounded-xl border border-ember/30 bg-ember/5 p-3">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-ember" aria-hidden="true" />
            <p className="text-xs text-ink/75">
              <strong className="text-ember">This ends bootstrap mode.</strong> Right now every admin implicitly acts
              as SUPER_ADMIN because no profile exists at all. The moment this profile is created, that stops — every
              other admin who still has no profile row immediately drops to SUPPORT, including you if this
              isn&rsquo;t your own row.
            </p>
          </div>
        )}

        {eligibleUsers.length === 0 ? (
          <p className="rounded-xl border border-ink/10 bg-mist/60 px-3 py-2 text-sm text-ink/60">
            Every Role.ADMIN account already has a profile row.
          </p>
        ) : (
          <>
            {initialUserId ? (
              <div className="mb-3">
                <p className="mb-1 text-xs font-semibold text-ink/70">Assigning to</p>
                <p className="font-data text-sm text-ink">{targetEmail}</p>
              </div>
            ) : (
              <div className="mb-3">
                <label htmlFor="create-target-user" className="mb-1 block text-xs font-semibold text-ink/70">
                  Assign to
                </label>
                <select
                  id="create-target-user"
                  value={userId}
                  onChange={(e) => handleUserChange(e.target.value)}
                  className="w-full rounded-lg border border-ink/10 bg-white px-3 py-2 text-sm outline-none focus:border-navy focus:ring-2 focus:ring-navy/20"
                >
                  {eligibleUsers.map((u) => (
                    <option key={u.userId} value={u.userId}>
                      {u.email}
                      {u.userId === viewerUserId ? " (you)" : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {selfBootstrapInit && (
              <p id="create-self-bootstrap-reason" className="mb-3 rounded-lg border border-navy/15 bg-navy/5 px-3 py-2 text-xs text-navy">
                This is your own account during bootstrap — the level is locked to SUPER_ADMIN. You already
                effectively hold SUPER_ADMIN with no row at all; this formalises it rather than escalating it.
              </p>
            )}
            {selfBlockedOutsideBootstrap && (
              <p
                id="create-self-blocked-reason"
                role="alert"
                className="mb-3 rounded-lg border border-ember/25 bg-ember/5 px-3 py-2 text-xs text-ember"
              >
                You cannot assign your own admin profile. Ask another SUPER_ADMIN to do this for you.
              </p>
            )}

            <label htmlFor="create-level" className="mb-1 block text-xs font-semibold text-ink/70">
              Level
            </label>
            <select
              id="create-level"
              value={level}
              disabled={selfBootstrapInit}
              aria-describedby={selfBootstrapInit ? "create-self-bootstrap-reason" : undefined}
              onChange={(e) => setLevel(e.target.value as AdminLevel)}
              className="mb-3 w-full rounded-lg border border-ink/10 bg-white px-3 py-2 font-data text-sm outline-none focus:border-navy focus:ring-2 focus:ring-navy/20 disabled:cursor-not-allowed disabled:bg-ink/5 disabled:text-ink/40"
            >
              {ADMIN_LEVELS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>

            <fieldset>
              <legend className="mb-2 text-xs font-semibold text-ink/70">
                Additional permissions <span className="font-normal text-ink/40">(beyond the level&rsquo;s own defaults, optional)</span>
              </legend>
              <div className="space-y-2">
                {ADMIN_PERMISSION_ORDER.map((p) => {
                  const meta = PERMISSION_META[p];
                  const superAdminGated = meta.superAdminOnly && level !== "SUPER_ADMIN";
                  const checked = permissions.has(p);
                  const describedById = superAdminGated ? `create-perm-reason-${p}` : undefined;
                  return (
                    <div key={p}>
                      <label
                        className={`flex items-start gap-2 rounded-lg border border-ink/10 px-3 py-2 text-xs ${
                          superAdminGated ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:bg-ink/[0.03]"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={superAdminGated}
                          aria-describedby={describedById}
                          onChange={() => togglePermission(p)}
                          className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-navy"
                        />
                        <span>
                          <span className="font-data font-semibold text-ink">{p}</span>
                          <span className="block text-ink/55">
                            {meta.label} — {meta.description}
                          </span>
                        </span>
                      </label>
                      {superAdminGated && (
                        <p id={`create-perm-reason-${p}`} className="ml-1 mt-1 text-[11px] text-ink/45">
                          Only takes effect at SUPER_ADMIN — granting it at {level} has no effect.
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </fieldset>
          </>
        )}

        {error && (
          <p role="alert" className="mt-3 text-xs text-ember">
            {error}
          </p>
        )}

        <div className="mt-5 flex items-center justify-end gap-2 border-t border-ink/5 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-ink/10 px-4 py-2 text-sm font-semibold text-ink/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={eligibleUsers.length === 0 || !userId || selfBlockedOutsideBootstrap || submitting}
            aria-describedby={selfBlockedOutsideBootstrap ? "create-self-blocked-reason" : undefined}
            onClick={() => void handleSubmit()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-navy px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2"
          >
            {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
            {isBootstrap ? "Create profile — ends bootstrap" : "Create profile"}
          </button>
        </div>
      </div>
    </div>
  );
}
