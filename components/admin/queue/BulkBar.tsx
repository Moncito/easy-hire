"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Check, Loader2, X } from "lucide-react";
import type { QueueKind, ReasonCodeOption } from "./types";
import type { BulkReviewQueueResult } from "@/lib/admin/bulk";

/**
 * Bulk toolbar + typed-confirmation dialog — docs/ADMIN-CONSOLE-PLAN.md
 * §4.2: "Bulk actions with a typed-confirmation step for rejections.
 * Approve-many is fine; reject-many needs friction." The friction itself is
 * already enforced server-side (mandatory reasonCode on bulk reject/hide,
 * lib/validations/admin.ts's adminBulkQueueReviewSchema) — this dialog adds
 * the UI half: the operator must type the exact selection count before the
 * request is even sent, not just click a confirm button.
 */

type BulkBarProps = {
  kind: QueueKind;
  selectedCount: number;
  reasonCodes: ReasonCodeOption[];
  onClear: () => void;
  onApprove: () => Promise<void>;
  onReject: (opts: { reasonCode: string; reason?: string; note?: string }) => Promise<void>;
  lastResult: { action: string; result: BulkReviewQueueResult } | null;
  onDismissResult: () => void;
  /** Lifted to the parent shell so the global keyboard-shortcut handler can
   * suppress j/k/a/r/Enter while this modal is open (docs/ADMIN-CONSOLE-PLAN.md
   * §4.2: "Shortcuts must not fire while focus is in a text input" — the
   * same rule extends to any open overlay, not just text fields). */
  confirmOpen: boolean;
  onOpenConfirm: () => void;
  onCloseConfirm: () => void;
};

const APPROVE_LABEL: Record<QueueKind, string> = {
  COMPANY: "Verify",
  JOB: "Approve",
  SEEKER: "Approve",
  REVIEW: "Restore",
};

const REJECT_LABEL: Record<QueueKind, string> = {
  COMPANY: "Reject",
  JOB: "Reject",
  SEEKER: "Reject",
  REVIEW: "Hide",
};

function TypedConfirmDialog({
  kind,
  count,
  reasonCodes,
  onCancel,
  onConfirm,
}: {
  kind: QueueKind;
  count: number;
  reasonCodes: ReasonCodeOption[];
  onCancel: () => void;
  onConfirm: (opts: { reasonCode: string; reason?: string; note?: string }) => Promise<void>;
}) {
  const isReview = kind === "REVIEW";
  const [reasonCode, setReasonCode] = useState("");
  const [freeText, setFreeText] = useState("");
  const [typedCount, setTypedCount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const dialogRef = useRef<HTMLDivElement>(null);
  const firstFieldRef = useRef<HTMLInputElement | HTMLSelectElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const triggerElementRef = useRef<Element | null>(null);

  const confirmed = typedCount.trim() === String(count);
  const reasonReady = isReview ? true : !!reasonCode;

  useEffect(() => {
    triggerElementRef.current = document.activeElement;
    firstFieldRef.current?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
        return;
      }
      if (e.key === "Tab" && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
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
      if (triggerElementRef.current instanceof HTMLElement) {
        triggerElementRef.current.focus();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleConfirm() {
    if (!confirmed || !reasonReady || submitting) return;
    setSubmitting(true);
    setLocalError(null);
    try {
      await onConfirm(
        isReview
          ? { reasonCode: reasonCode.trim(), note: freeText || undefined }
          : { reasonCode, reason: freeText || undefined }
      );
    } catch {
      setLocalError("The bulk action failed to send. Try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4" onClick={onCancel}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="bulk-confirm-title"
        className="w-full max-w-md rounded-2xl border border-ink/10 bg-white p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-ember" aria-hidden="true" />
          <div>
            <h2 id="bulk-confirm-title" className="font-display text-lg font-bold text-ink">
              {REJECT_LABEL[kind]} {count} item{count === 1 ? "" : "s"}?
            </h2>
            <p className="mt-1 text-sm text-ink/60">This cannot be bulk-undone. Type the count below to confirm.</p>
          </div>
        </div>

        {isReview ? (
          <>
            <label htmlFor="bulk-reason-free" className="mb-1 block text-xs font-semibold text-ink/70">
              Reason code <span className="text-ember">*</span> <span className="font-normal text-ink/40">(max 64 characters)</span>
            </label>
            <input
              ref={firstFieldRef as React.RefObject<HTMLInputElement>}
              id="bulk-reason-free"
              type="text"
              maxLength={64}
              value={reasonCode}
              onChange={(e) => setReasonCode(e.target.value)}
              className="w-full rounded-lg border border-ink/10 px-3 py-2 text-sm outline-none focus:border-navy focus:ring-2 focus:ring-navy/20"
            />
          </>
        ) : (
          <>
            <label htmlFor="bulk-reason-select" className="mb-1 block text-xs font-semibold text-ink/70">
              Reason code <span className="text-ember">*</span>
            </label>
            <select
              ref={firstFieldRef as React.RefObject<HTMLSelectElement>}
              id="bulk-reason-select"
              value={reasonCode}
              onChange={(e) => setReasonCode(e.target.value)}
              className="w-full rounded-lg border border-ink/10 bg-white px-3 py-2 text-sm outline-none focus:border-navy focus:ring-2 focus:ring-navy/20"
            >
              <option value="">Select a reason…</option>
              {reasonCodes.map((rc) => (
                <option key={rc.code} value={rc.code}>
                  {rc.label}
                </option>
              ))}
            </select>
          </>
        )}

        <label htmlFor="bulk-note" className="mb-1 mt-3 block text-xs font-semibold text-ink/70">
          Note <span className="font-normal text-ink/40">(optional)</span>
        </label>
        <textarea
          id="bulk-note"
          rows={2}
          maxLength={500}
          value={freeText}
          onChange={(e) => setFreeText(e.target.value)}
          className="w-full resize-y rounded-lg border border-ink/10 px-3 py-2 text-sm outline-none focus:border-navy focus:ring-2 focus:ring-navy/20"
        />

        <label htmlFor="bulk-typed-count" className="mb-1 mt-3 block text-xs font-semibold text-ink/70">
          Type <span className="font-data font-bold text-ink">{count}</span> to confirm
        </label>
        <input
          id="bulk-typed-count"
          type="text"
          inputMode="numeric"
          value={typedCount}
          onChange={(e) => setTypedCount(e.target.value)}
          className="w-full rounded-lg border border-ink/10 px-3 py-2 font-data text-sm outline-none focus:border-navy focus:ring-2 focus:ring-navy/20"
        />

        {localError && (
          <p role="alert" className="mt-2 text-xs text-ember">
            {localError}
          </p>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            aria-label="Cancel bulk action"
            className="rounded-xl border border-ink/10 px-4 py-2 text-sm font-semibold text-ink/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!confirmed || !reasonReady || submitting}
            onClick={handleConfirm}
            className="inline-flex items-center gap-1.5 rounded-xl bg-ember px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember focus-visible:ring-offset-2"
          >
            {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
            Confirm {REJECT_LABEL[kind].toLowerCase()}
          </button>
        </div>
      </div>
    </div>
  );
}

function ResultBreakdown({
  action,
  result,
  onDismiss,
}: {
  action: string;
  result: BulkReviewQueueResult;
  onDismiss: () => void;
}) {
  const failed = result.results.filter((r) => !r.ok);
  return (
    <div className="mt-3 rounded-xl border border-ink/10 bg-mist/60 p-3 text-xs">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-ink">
          {action}: {result.succeeded} succeeded, {result.failed} failed
        </p>
        <button type="button" onClick={onDismiss} aria-label="Dismiss bulk result" className="text-ink/40 hover:text-ink">
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
      {failed.length > 0 && (
        <ul className="mt-2 space-y-1">
          {failed.map((f) => (
            <li key={f.id} className="flex items-center gap-1.5 text-ember">
              <AlertTriangle className="h-3 w-3 shrink-0" aria-hidden="true" />
              <span className="font-data">{f.id}</span>
              <span className="text-ink/60">— {f.error}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function BulkBar({
  kind,
  selectedCount,
  reasonCodes,
  onClear,
  onApprove,
  onReject,
  lastResult,
  onDismissResult,
  confirmOpen,
  onOpenConfirm,
  onCloseConfirm,
}: BulkBarProps) {
  const [approving, setApproving] = useState(false);

  if (selectedCount === 0 && !lastResult) return null;

  async function handleApprove() {
    setApproving(true);
    await onApprove();
    setApproving(false);
  }

  return (
    <div className="sticky bottom-0 z-20 mt-3 rounded-2xl border border-navy/15 bg-white p-3 shadow-lg">
      {selectedCount > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold text-ink">
            {selectedCount} item{selectedCount === 1 ? "" : "s"} selected
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClear}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-ink/55 hover:bg-ink/5"
            >
              Clear selection
            </button>
            <button
              type="button"
              disabled={approving}
              onClick={handleApprove}
              className="inline-flex items-center gap-1.5 rounded-xl bg-teal px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal/95 disabled:opacity-60"
            >
              {approving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Check className="h-4 w-4" aria-hidden="true" />}
              {APPROVE_LABEL[kind]} {selectedCount}
            </button>
            <button
              type="button"
              onClick={onOpenConfirm}
              className="inline-flex items-center gap-1.5 rounded-xl border border-ember/30 px-4 py-2 text-sm font-semibold text-ember hover:bg-ember/5"
            >
              <X className="h-4 w-4" aria-hidden="true" />
              {REJECT_LABEL[kind]} {selectedCount}…
            </button>
          </div>
        </div>
      )}

      {lastResult && <ResultBreakdown action={lastResult.action} result={lastResult.result} onDismiss={onDismissResult} />}

      {confirmOpen && (
        <TypedConfirmDialog
          kind={kind}
          count={selectedCount}
          reasonCodes={reasonCodes}
          onCancel={onCloseConfirm}
          onConfirm={async (opts) => {
            await onReject(opts);
            onCloseConfirm();
          }}
        />
      )}
    </div>
  );
}
