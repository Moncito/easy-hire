"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Info, Loader2, Trash2, X } from "lucide-react";
import { ADMIN_PERMISSION_ORDER, PERMISSION_META } from "./permissionMeta";
import { ADMIN_LEVELS, type AdminLevel, type AdminPermission, type SerializedAdminTeamRow } from "./types";

/**
 * Edit an existing `AdminProfile` (level + additive permissions) and, from
 * the same surface, revoke it. Two of the three backend-enforced states this
 * task calls out apply directly to this dialog:
 *
 *  - Self-escalation: `row.isSelf` disables every mutating control here, with
 *    the reason stated as visible text tied to the control via
 *    `aria-describedby` — not only a `title` attribute.
 *  - Last-SUPER_ADMIN lockout: `row.isLastSuperAdmin` locks the level select
 *    (cannot move away from SUPER_ADMIN) and the revoke button, same
 *    accessible-reason treatment.
 *
 * Revoke gets the SAME typed-confirmation friction as
 * components/admin/directory/SupportActions.tsx's delete dialog and
 * components/admin/queue/BulkBar.tsx's bulk-reject dialog — type the exact
 * email, focus-trapped, labelled dismiss. Ember here is legitimate: revoking
 * a profile is destructive (the admin drops to SUPPORT immediately).
 */

export type AdminProfileEditorProps = {
  row: SerializedAdminTeamRow;
  onClose: () => void;
  onSave: (input: { level: AdminLevel; permissions: AdminPermission[] }) => Promise<{ ok: boolean; error?: string }>;
  onRevoke: () => Promise<{ ok: boolean; error?: string }>;
};

function useDialogFocusTrap(dialogRef: React.RefObject<HTMLDivElement | null>, onCancel: () => void) {
  useEffect(() => {
    const triggerElement = document.activeElement;
    const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
      'button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    focusable?.[0]?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
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
}

function RevokeConfirmDialog({
  email,
  submitting,
  error,
  onCancel,
  onConfirm,
}: {
  email: string;
  submitting: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const [typedEmail, setTypedEmail] = useState("");
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialogFocusTrap(dialogRef, onCancel);

  const confirmed = typedEmail.trim().toLowerCase() === email.toLowerCase();

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/40 px-4" onClick={onCancel}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="revoke-confirm-title"
        aria-describedby="revoke-confirm-body"
        className="w-full max-w-md rounded-2xl border border-ember/25 bg-white p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-ember" aria-hidden="true" />
          <div>
            <h2 id="revoke-confirm-title" className="font-display text-lg font-bold text-ink">
              Revoke this admin profile?
            </h2>
            <p id="revoke-confirm-body" className="mt-1 text-sm text-ink/65">
              This is immediate: <strong className="text-ember">{email}</strong> drops to SUPPORT the next time their
              access is resolved — they lose every permission this profile grants right away, not on their next
              sign-in.
            </p>
          </div>
        </div>

        <label htmlFor="revoke-typed-email" className="mb-1 mt-2 block text-xs font-semibold text-ink/70">
          Type <span className="font-data font-bold text-ink">{email}</span> to confirm
        </label>
        <input
          id="revoke-typed-email"
          type="text"
          autoComplete="off"
          spellCheck={false}
          value={typedEmail}
          onChange={(e) => setTypedEmail(e.target.value)}
          className="w-full rounded-lg border border-ink/10 px-3 py-2 font-data text-sm outline-none focus:border-ember focus:ring-2 focus:ring-ember/20"
        />

        {error && (
          <p role="alert" className="mt-2 text-xs text-ember">
            {error}
          </p>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            aria-label="Cancel revoking this admin profile"
            className="rounded-xl border border-ink/10 px-4 py-2 text-sm font-semibold text-ink/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!confirmed || submitting}
            onClick={onConfirm}
            className="inline-flex items-center gap-1.5 rounded-xl bg-ember px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember focus-visible:ring-offset-2"
          >
            {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
            Revoke permanently
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminProfileEditor({ row, onClose, onSave, onRevoke }: AdminProfileEditorProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialogFocusTrap(dialogRef, onClose);

  const [level, setLevel] = useState<AdminLevel>(row.level);
  const [permissions, setPermissions] = useState<Set<AdminPermission>>(new Set(row.rawPermissions));
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [revokeOpen, setRevokeOpen] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [revokeError, setRevokeError] = useState<string | null>(null);

  const locked = row.isSelf;
  const levelLocked = row.isLastSuperAdmin; // cannot move away from SUPER_ADMIN while this is the only one

  function togglePermission(p: AdminPermission) {
    if (locked) return;
    setPermissions((prev) => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p);
      else next.add(p);
      return next;
    });
  }

  async function handleSave() {
    setSaveError(null);
    setSaving(true);
    const res = await onSave({ level, permissions: Array.from(permissions) });
    setSaving(false);
    if (!res.ok) setSaveError(res.error ?? "Could not save changes.");
  }

  async function handleRevokeConfirm() {
    setRevokeError(null);
    setRevoking(true);
    const res = await onRevoke();
    setRevoking(false);
    if (!res.ok) {
      setRevokeError(res.error ?? "Could not revoke this profile.");
      return;
    }
    setRevokeOpen(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4" onClick={onClose}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="editor-title"
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-ink/10 bg-white p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 id="editor-title" className="font-display text-lg font-bold text-ink">
              Manage {row.email}
            </h2>
            <p className="mt-0.5 font-data text-xs text-ink/45">{row.userId}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-ink/40 hover:bg-ink/5 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {locked && (
          <p
            id="editor-self-reason"
            className="mb-4 flex items-start gap-2 rounded-xl border border-navy/15 bg-navy/5 px-3 py-2 text-xs text-navy"
          >
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            This is your own account. Nobody may change their own admin level or permissions, including SUPER_ADMIN —
            every control below is read-only.
          </p>
        )}

        {!locked && levelLocked && (
          <p
            id="editor-lastsuper-reason"
            className="mb-4 flex items-start gap-2 rounded-xl border border-navy/15 bg-navy/5 px-3 py-2 text-xs text-navy"
          >
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            This is the last remaining SUPER_ADMIN. The level cannot be changed away from SUPER_ADMIN and this profile
            cannot be revoked until another SUPER_ADMIN exists.
          </p>
        )}

        <label htmlFor="editor-level" className="mb-1 block text-xs font-semibold text-ink/70">
          Level
        </label>
        <select
          id="editor-level"
          value={level}
          disabled={locked || levelLocked}
          aria-describedby={locked ? "editor-self-reason" : levelLocked ? "editor-lastsuper-reason" : undefined}
          onChange={(e) => setLevel(e.target.value as AdminLevel)}
          className="w-full rounded-lg border border-ink/10 bg-white px-3 py-2 font-data text-sm outline-none focus:border-navy focus:ring-2 focus:ring-navy/20 disabled:cursor-not-allowed disabled:bg-ink/5 disabled:text-ink/40"
        >
          {ADMIN_LEVELS.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>

        <fieldset className="mt-4" disabled={locked}>
          <legend className="mb-2 text-xs font-semibold text-ink/70">
            Additional permissions <span className="font-normal text-ink/40">(beyond the level&rsquo;s own defaults)</span>
          </legend>
          <div className="space-y-2">
            {ADMIN_PERMISSION_ORDER.map((p) => {
              const meta = PERMISSION_META[p];
              const superAdminGated = meta.superAdminOnly && level !== "SUPER_ADMIN";
              const checked = permissions.has(p);
              const describedById = superAdminGated ? `perm-reason-${p}` : undefined;
              return (
                <div key={p}>
                  <label
                    className={`flex items-start gap-2 rounded-lg border border-ink/10 px-3 py-2 text-xs ${
                      locked || superAdminGated ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:bg-ink/[0.03]"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={locked || superAdminGated}
                      aria-describedby={describedById}
                      onChange={() => togglePermission(p)}
                      className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-navy"
                    />
                    <span>
                      <span className="font-data font-semibold text-ink">{p}</span>
                      <span className="block text-ink/55">{meta.label} — {meta.description}</span>
                    </span>
                  </label>
                  {superAdminGated && (
                    <p id={`perm-reason-${p}`} className="ml-1 mt-1 text-[11px] text-ink/45">
                      Only takes effect at SUPER_ADMIN — granting it at {level} has no effect.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </fieldset>

        {row.ineffectiveGrants.length > 0 && (
          <p className="mt-3 flex items-start gap-2 rounded-lg border border-ink/10 bg-mist/60 px-3 py-2 text-[11px] text-ink/55">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink/35" aria-hidden="true" />
            Currently stored but not in effect at this level:{" "}
            <span className="font-data">{row.ineffectiveGrants.join(", ")}</span>
          </p>
        )}

        {saveError && (
          <p role="alert" className="mt-3 text-xs text-ember">
            {saveError}
          </p>
        )}

        <div className="mt-5 flex items-center justify-between gap-2 border-t border-ink/5 pt-4">
          <button
            type="button"
            disabled={locked || levelLocked || revoking}
            aria-describedby={locked ? "editor-self-reason" : levelLocked ? "editor-lastsuper-reason" : undefined}
            onClick={() => setRevokeOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-ember/30 px-3.5 py-2 text-xs font-semibold text-ember hover:bg-ember/5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            Revoke profile…
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-ink/10 px-4 py-2 text-sm font-semibold text-ink/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy"
            >
              Close
            </button>
            <button
              type="button"
              disabled={locked || saving}
              aria-describedby={locked ? "editor-self-reason" : undefined}
              onClick={() => void handleSave()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-navy px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2"
            >
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
              Save changes
            </button>
          </div>
        </div>

        {revokeOpen && (
          <RevokeConfirmDialog
            email={row.email}
            submitting={revoking}
            error={revokeError}
            onCancel={() => setRevokeOpen(false)}
            onConfirm={() => void handleRevokeConfirm()}
          />
        )}
      </div>
    </div>
  );
}
