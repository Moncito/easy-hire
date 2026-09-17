"use client";

import { useRef, useState } from "react";
import { Loader2, X } from "lucide-react";
import { useDialogFocusTrap } from "@/components/admin/useDialogFocusTrap";
import ModalPortal from "@/components/admin/ui/ModalPortal";
import { RolloutCell } from "./rolloutDisplay";

/**
 * Create a new feature flag. Same dialog shape as
 * `components/admin/team/CreateAdminProfileForm.tsx`. `key` validation
 * (lowercase, dot/hyphen/underscore-separated) mirrors
 * `lib/validations/admin.ts`'s `featureFlagKeySchema` client-side for instant
 * feedback — the server re-validates regardless, this is not the real gate.
 */

const KEY_PATTERN = /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/;
const KEY_MAX_LENGTH = 100;

export type CreateFeatureFlagFormProps = {
  onClose: () => void;
  onSubmit: (input: { key: string; description: string; enabled: boolean; rolloutPercentage: number | null }) => Promise<{
    ok: boolean;
    error?: string;
  }>;
};

export default function CreateFeatureFlagForm({ onClose, onSubmit }: CreateFeatureFlagFormProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialogFocusTrap(dialogRef, onClose);

  const [key, setKey] = useState("");
  const [description, setDescription] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [hasPercentage, setHasPercentage] = useState(false);
  const [percentage, setPercentage] = useState(100);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmedKey = key.trim();
  const keyValid = trimmedKey.length > 0 && trimmedKey.length <= KEY_MAX_LENGTH && KEY_PATTERN.test(trimmedKey);
  const descriptionValid = description.trim().length > 0;
  const canSubmit = keyValid && descriptionValid && !submitting;

  async function handleSubmit() {
    if (!canSubmit) return;
    setError(null);
    setSubmitting(true);
    const res = await onSubmit({
      key: trimmedKey,
      description: description.trim(),
      enabled,
      rolloutPercentage: hasPercentage ? percentage : null,
    });
    setSubmitting(false);
    if (!res.ok) setError(res.error ?? "Could not create the feature flag.");
  }

  return (
    <ModalPortal>
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/40 backdrop-blur-sm px-4" onClick={onClose}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-flag-title"
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-ink/10 bg-white p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 id="create-flag-title" className="font-display text-lg font-bold text-ink">
            Create a feature flag
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

        <label htmlFor="create-flag-key" className="mb-1 block text-xs font-semibold text-ink/70">
          Key
        </label>
        <input
          id="create-flag-key"
          type="text"
          autoComplete="off"
          spellCheck={false}
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="seeker.new-dashboard"
          aria-describedby="create-flag-key-hint"
          className="w-full rounded-lg border border-ink/10 px-3 py-2 font-data text-sm outline-none focus:border-navy focus:ring-2 focus:ring-navy/20"
        />
        <p id="create-flag-key-hint" className="mt-1 text-[11px] text-ink/45">
          Lowercase alphanumeric segments separated by dots, hyphens, or underscores. Plain text — a new flag is a
          row, not a migration.
        </p>

        <label htmlFor="create-flag-description" className="mb-1 mt-3 block text-xs font-semibold text-ink/70">
          Description
        </label>
        <textarea
          id="create-flag-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          maxLength={500}
          className="w-full rounded-lg border border-ink/10 px-3 py-2 text-sm outline-none focus:border-navy focus:ring-2 focus:ring-navy/20"
        />

        <label className="mt-4 flex items-center gap-2 text-sm font-medium text-ink">
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="h-4 w-4 shrink-0 accent-navy" />
          Enabled
        </label>
        <p className="mt-1 text-xs text-ink/45">Off by default — a freshly-created flag never accidentally goes live.</p>

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
          ) : (
            <p className="mt-1.5 text-[11px] text-ink/45">No percentage gate — fully on the moment it&rsquo;s enabled.</p>
          )}
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-lg bg-mist/60 px-3 py-2">
          <span className="text-xs font-semibold text-ink/55">Preview:</span>
          <RolloutCell enabled={enabled} rolloutPercentage={hasPercentage ? percentage : null} />
        </div>

        {error && (
          <p role="alert" className="mt-3 text-xs text-ember">
            {error}
          </p>
        )}

        <div className="mt-5 flex justify-end gap-2 border-t border-ink/5 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-ink/10 px-4 py-2 text-sm font-semibold text-ink/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canSubmit}
            onClick={() => void handleSubmit()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-navy px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2"
          >
            {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
            Create flag
          </button>
        </div>
      </div>
    </div>
    </ModalPortal>
  );
}
