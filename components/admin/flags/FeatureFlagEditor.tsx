"use client";

import { useRef, useState } from "react";
import { AlertTriangle, Loader2, Trash2, X } from "lucide-react";
import { useDialogFocusTrap } from "@/components/admin/useDialogFocusTrap";
import { RolloutCell } from "./rolloutDisplay";
import type { SerializedFeatureFlag } from "./types";

/**
 * Edit an existing flag's description/enabled/rollout, and — from the same
 * surface — delete it. Same shape as
 * `components/admin/team/AdminProfileEditor.tsx`: a focus-trapped dialog with
 * a nested typed-confirmation dialog for the destructive action.
 *
 * Delete gets the SAME typed-confirmation friction as
 * `AdminProfileEditor`'s revoke and `BulkBar`'s bulk-reject dialog — type the
 * exact flag `key`, focus-trapped, labelled dismiss. Ember here is
 * legitimate: deleting a flag that code still reads (`isFeatureEnabled`)
 * changes behaviour silently for every caller, with no warning at the call
 * site — it earns friction per the task spec.
 */

export type FeatureFlagEditorProps = {
  row: SerializedFeatureFlag;
  onClose: () => void;
  onSave: (input: { description: string; enabled: boolean; rolloutPercentage: number | null }) => Promise<{ ok: boolean; error?: string }>;
  onDelete: () => Promise<{ ok: boolean; error?: string }>;
};

function DeleteConfirmDialog({
  flagKey,
  submitting,
  error,
  onCancel,
  onConfirm,
}: {
  flagKey: string;
  submitting: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const [typedKey, setTypedKey] = useState("");
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialogFocusTrap(dialogRef, onCancel);

  const confirmed = typedKey.trim() === flagKey;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/40 px-4" onClick={onCancel}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-flag-title"
        aria-describedby="delete-flag-body"
        className="w-full max-w-md rounded-2xl border border-ember/25 bg-white p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-ember" aria-hidden="true" />
          <div>
            <h2 id="delete-flag-title" className="font-display text-lg font-bold text-ink">
              Delete this feature flag?
            </h2>
            <p id="delete-flag-body" className="mt-1 text-sm text-ink/65">
              Any code still calling <code className="font-data text-ink">isFeatureEnabled(&quot;{flagKey}&quot;)</code>{" "}
              will get <code className="font-data text-ink">false</code> from the moment this is deleted, silently —
              there is no warning at the call site. This cannot be undone from here.
            </p>
          </div>
        </div>

        <label htmlFor="delete-typed-key" className="mb-1 mt-2 block text-xs font-semibold text-ink/70">
          Type <span className="font-data font-bold text-ink">{flagKey}</span> to confirm
        </label>
        <input
          id="delete-typed-key"
          type="text"
          autoComplete="off"
          spellCheck={false}
          value={typedKey}
          onChange={(e) => setTypedKey(e.target.value)}
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
            aria-label="Cancel deleting this feature flag"
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
            Delete permanently
          </button>
        </div>
      </div>
    </div>
  );
}

export default function FeatureFlagEditor({ row, onClose, onSave, onDelete }: FeatureFlagEditorProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialogFocusTrap(dialogRef, onClose);

  const [description, setDescription] = useState(row.description);
  const [enabled, setEnabled] = useState(row.enabled);
  const [hasPercentage, setHasPercentage] = useState(row.rolloutPercentage !== null);
  const [percentage, setPercentage] = useState(row.rolloutPercentage ?? 100);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleSave() {
    setSaveError(null);
    setSaving(true);
    const res = await onSave({
      description: description.trim(),
      enabled,
      rolloutPercentage: hasPercentage ? percentage : null,
    });
    setSaving(false);
    if (!res.ok) setSaveError(res.error ?? "Could not save changes.");
  }

  async function handleDeleteConfirm() {
    setDeleteError(null);
    setDeleting(true);
    const res = await onDelete();
    setDeleting(false);
    if (!res.ok) {
      setDeleteError(res.error ?? "Could not delete this flag.");
      return;
    }
    setDeleteOpen(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4" onClick={onClose}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="flag-editor-title"
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-ink/10 bg-white p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 id="flag-editor-title" className="font-display text-lg font-bold text-ink">
              Edit flag
            </h2>
            <p className="mt-0.5 font-data text-xs text-ink/45">{row.key}</p>
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

        <label htmlFor="flag-description" className="mb-1 block text-xs font-semibold text-ink/70">
          Description
        </label>
        <textarea
          id="flag-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          maxLength={500}
          className="w-full rounded-lg border border-ink/10 px-3 py-2 text-sm outline-none focus:border-navy focus:ring-2 focus:ring-navy/20"
        />

        <label className="mt-4 flex items-center gap-2 text-sm font-medium text-ink">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="h-4 w-4 shrink-0 accent-navy"
          />
          Enabled
        </label>
        <p className="mt-1 text-xs text-ink/45">
          When off, this flag returns <span className="font-data">false</span> for everyone regardless of the
          percentage below.
        </p>

        <div className="mt-4 rounded-xl border border-ink/10 p-3">
          <label className="flex items-center gap-2 text-sm font-medium text-ink">
            <input
              type="checkbox"
              checked={hasPercentage}
              disabled={!enabled}
              onChange={(e) => setHasPercentage(e.target.checked)}
              className="h-4 w-4 shrink-0 accent-navy disabled:cursor-not-allowed"
            />
            Limit to a percentage rollout
          </label>
          {hasPercentage ? (
            <>
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={percentage}
                  disabled={!enabled}
                  onChange={(e) => setPercentage(Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
                  className="w-24 rounded-lg border border-ink/10 px-3 py-1.5 font-data text-sm outline-none focus:border-navy focus:ring-2 focus:ring-navy/20 disabled:bg-ink/5 disabled:text-ink/40"
                />
                <span className="text-sm text-ink/55">%</span>
              </div>
              <p className="mt-1.5 text-[11px] text-ink/45">
                Deterministic per-user bucket — the same user always lands the same way for this flag; this is not a
                per-request dice roll.
              </p>
            </>
          ) : (
            <p className="mt-1.5 text-[11px] text-ink/45">
              No percentage gate — every user gets it the moment this flag is enabled (100% on).
            </p>
          )}
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-lg bg-mist/60 px-3 py-2">
          <span className="text-xs font-semibold text-ink/55">Preview:</span>
          <RolloutCell enabled={enabled} rolloutPercentage={hasPercentage ? percentage : null} />
        </div>

        {saveError && (
          <p role="alert" className="mt-3 text-xs text-ember">
            {saveError}
          </p>
        )}

        <div className="mt-5 flex items-center justify-between gap-2 border-t border-ink/5 pt-4">
          <button
            type="button"
            disabled={deleting}
            onClick={() => setDeleteOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-ember/30 px-3.5 py-2 text-xs font-semibold text-ember hover:bg-ember/5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            Delete flag…
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
              disabled={saving || description.trim().length === 0}
              onClick={() => void handleSave()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-navy px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2"
            >
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
              Save changes
            </button>
          </div>
        </div>

        {deleteOpen && (
          <DeleteConfirmDialog
            flagKey={row.key}
            submitting={deleting}
            error={deleteError}
            onCancel={() => setDeleteOpen(false)}
            onConfirm={() => void handleDeleteConfirm()}
          />
        )}
      </div>
    </div>
  );
}
