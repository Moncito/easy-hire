"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import type { RefObject } from "react";
import { AlertTriangle, Check, Loader2, X } from "lucide-react";
import AdminButton from "../ui/Button";
import AdminSelect from "../ui/Select";
import ModalPortal from "../ui/ModalPortal";
import { useDialogFocusTrap } from "@/components/admin/useDialogFocusTrap";
import type { QueueKind, ReasonCodeOption } from "./types";

/**
 * Approve/reject (or restore/hide, for REVIEW) + reason-code selector —
 * docs/ADMIN-CONSOLE-PLAN.md §4.2: "Decision reasons are a controlled
 * vocabulary, not free text. Enum plus optional note."
 *
 * REVIEW has no commissioned reason-code vocabulary (lib/admin/reason-codes.ts
 * header comment). Chosen behaviour for this kind, per the task's explicit
 * either/or: a free-text reason-code field, capped at 64 characters (matches
 * the server's own cap on `adminReviewResolveSchema.reasonCode` /
 * `adminBulkQueueReviewSchema.reasonCode`), rather than omitting the field —
 * an operator hiding a review still gets to record *why*, it's just not
 * constrained to a fixed list the way company/job/seeker rejections are.
 *
 * Server rule this form must match exactly: `reasonCode` is REJECTED by the
 * API on approve/restore and only accepted on reject/hide (see the
 * `superRefine` blocks in lib/validations/{admin,review}.ts) — so the field
 * is only ever sent when the reject/hide panel is open.
 */

export type DecisionAction = "approve" | "reject" | "restore" | "hide";

export type DecisionFormHandle = {
  /** `r` shortcut — opens the reject/hide confirm modal and focuses the reason control. */
  focusReject: () => void;
  /** `Enter` shortcut — commits whatever is currently staged (see ReviewQueue's keydown handler for the exact rule). */
  commit: () => void;
  /**
   * Lets ReviewQueue.tsx's global keydown handler know the reject/hide
   * confirm modal is open, the same way it already tracks `bulkConfirmOpen`/
   * `shortcutSheetOpen` locally — this state lives here instead (it's
   * per-item, reset on `itemId` change), so it's exposed through the ref
   * rather than lifted, matching how `focusReject`/`commit` already cross
   * that boundary.
   */
  isRejectOpen: () => boolean;
};

type DecisionFormProps = {
  kind: QueueKind;
  itemId: string;
  itemTitle: string;
  reasonCodes: ReasonCodeOption[];
  disabled?: boolean;
  onDecide: (action: DecisionAction, opts: { reason?: string; note?: string; reasonCode?: string }) => Promise<boolean>;
};

const APPROVE_LABEL: Record<QueueKind, string> = {
  COMPANY: "Verify company",
  JOB: "Approve job",
  SEEKER: "Approve verification",
  REVIEW: "Restore review",
  REPORT: "Action report",
};

// See BulkBar's note: for REPORT, "reject" means DISMISSED — the half of the
// decision that needs to be explainable later.
const REJECT_LABEL: Record<QueueKind, string> = {
  COMPANY: "Reject",
  JOB: "Reject",
  SEEKER: "Reject",
  REVIEW: "Hide review",
  REPORT: "Dismiss report",
};

/**
 * Reject/hide confirm modal — a real overlay dialog, modeled directly on
 * BulkBar.tsx's `TypedConfirmDialog` shell (same backdrop, panel classes,
 * heading treatment, and `useDialogFocusTrap` wiring). Kept as its own
 * component, same as `TypedConfirmDialog`, rather than an inline conditional
 * block in `DecisionForm`, so `useDialogFocusTrap` — which always runs its
 * focus-trap effect on mount — only ever mounts while `rejectOpen` is true,
 * instead of being called conditionally inside a single always-mounted
 * component (not allowed for hooks).
 */
function RejectConfirmModal({
  kind,
  itemTitle,
  isReview,
  reasonCodes,
  reasonCode,
  setReasonCode,
  freeText,
  setFreeText,
  localError,
  busy,
  submitting,
  rejectAction,
  reasonSelectRef,
  reasonTextRef,
  onCancel,
  onConfirm,
}: {
  kind: QueueKind;
  itemTitle: string;
  isReview: boolean;
  reasonCodes: ReasonCodeOption[];
  reasonCode: string;
  setReasonCode: (v: string) => void;
  freeText: string;
  setFreeText: (v: string) => void;
  localError: string | null;
  busy: boolean;
  submitting: DecisionAction | null;
  rejectAction: DecisionAction;
  reasonSelectRef: RefObject<HTMLButtonElement | null>;
  reasonTextRef: RefObject<HTMLInputElement | null>;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialogFocusTrap(dialogRef, onCancel);

  return (
    <ModalPortal>
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/40 backdrop-blur-sm px-4" onClick={onCancel}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="reject-confirm-title"
        className="w-full max-w-md rounded-2xl border border-ink/10 bg-white p-6 shadow-lg admin-dark:border-white/10 admin-dark:bg-admin-dark-surface"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-ember" aria-hidden="true" />
          <div>
            <h2 id="reject-confirm-title" className="font-display text-lg font-bold text-ink admin-dark:text-mist">
              {REJECT_LABEL[kind]} {itemTitle}?
            </h2>
            <p className="mt-1 text-sm text-ink/60 admin-dark:text-mist/60">
              {isReview
                ? "This hides the review from public view. It can be restored later from the Rejected tab."
                : "This records a rejection with the reason below and moves the item to the Rejected tab."}
            </p>
          </div>
        </div>

        {isReview ? (
          <>
            <label htmlFor="reason-code-free" className="mb-1 block text-xs font-semibold text-ink/70 admin-dark:text-mist/70">
              Reason code <span className="font-normal text-ink/40 admin-dark:text-mist/40">(optional, max 64 characters)</span>
            </label>
            <input
              ref={reasonTextRef}
              id="reason-code-free"
              type="text"
              maxLength={64}
              value={reasonCode}
              onChange={(e) => setReasonCode(e.target.value)}
              placeholder="e.g. FABRICATED_CLAIM"
              className="w-full rounded-lg border border-ink/10 px-3 py-2 text-sm outline-none focus:border-navy focus:ring-2 focus:ring-navy/20 admin-dark:border-white/15 admin-dark:bg-white/5 admin-dark:text-mist admin-dark:placeholder:text-mist/35"
            />
          </>
        ) : (
          <>
            <label htmlFor="reason-code-select" className="mb-1 block text-xs font-semibold text-ink/70 admin-dark:text-mist/70">
              Reason code <span className="text-ember">*</span>
            </label>
            <AdminSelect
              ref={reasonSelectRef}
              id="reason-code-select"
              value={reasonCode}
              onChange={setReasonCode}
              options={reasonCodes.map((rc) => ({ value: rc.code, label: rc.label }))}
              placeholder="Select a reason…"
              aria-label="Reason code"
              required
            />
          </>
        )}

        <label htmlFor="reason-note" className="mb-1 mt-3 block text-xs font-semibold text-ink/70 admin-dark:text-mist/70">
          {isReview ? "Note" : "Note to the employer"} <span className="font-normal text-ink/40 admin-dark:text-mist/40">(optional)</span>
        </label>
        <textarea
          id="reason-note"
          rows={3}
          maxLength={500}
          value={freeText}
          onChange={(e) => setFreeText(e.target.value)}
          placeholder="Add context for the record…"
          className="w-full resize-y rounded-lg border border-ink/10 px-3 py-2 text-sm outline-none focus:border-navy focus:ring-2 focus:ring-navy/20 admin-dark:border-white/15 admin-dark:bg-white/5 admin-dark:text-mist admin-dark:placeholder:text-mist/35"
        />

        {localError && (
          <p role="alert" className="mt-2 text-xs text-ember">
            {localError}
          </p>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <AdminButton variant="secondary" onClick={onCancel}>
            Cancel
          </AdminButton>
          <AdminButton variant="danger" disabled={busy} onClick={onConfirm}>
            {submitting === rejectAction && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
            Confirm {REJECT_LABEL[kind].toLowerCase()}
            <kbd className="ml-1 rounded border border-white/30 px-1 text-[10px] font-data opacity-80">Enter</kbd>
          </AdminButton>
        </div>
      </div>
    </div>
    </ModalPortal>
  );
}

const DecisionForm = forwardRef<DecisionFormHandle, DecisionFormProps>(function DecisionForm(
  { kind, itemId, itemTitle, reasonCodes, disabled, onDecide },
  ref
) {
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reasonCode, setReasonCode] = useState("");
  const [freeText, setFreeText] = useState("");
  const [submitting, setSubmitting] = useState<DecisionAction | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const reasonSelectRef = useRef<HTMLButtonElement>(null);
  const reasonTextRef = useRef<HTMLInputElement>(null);

  const isReview = kind === "REVIEW";
  const approveAction: DecisionAction = isReview ? "restore" : "approve";
  const rejectAction: DecisionAction = isReview ? "hide" : "reject";
  // Defensive fallback for a blank/whitespace-only title (a real data-quality
  // gap upstream, e.g. an empty companyName) — without this, the reject
  // heading below renders as a bare "Reject ?" with nothing between the verb
  // and the question mark, which reads as broken rather than as "no name".
  const safeItemTitle = itemTitle.trim() || "this item";

  // A fresh item resets any in-progress reject panel — never carry a typed
  // reason from one item over to the next.
  useEffect(() => {
    setRejectOpen(false);
    setReasonCode("");
    setFreeText("");
    setLocalError(null);
    setSubmitting(null);
  }, [itemId]);

  async function submitApprove() {
    setLocalError(null);
    setSubmitting(approveAction);
    const ok = await onDecide(approveAction, {});
    setSubmitting(null);
    if (!ok) setLocalError("That approval could not be saved — see the notice above.");
  }

  async function submitReject() {
    if (!isReview && !reasonCode) {
      setLocalError("Pick a reason code before rejecting.");
      reasonSelectRef.current?.focus();
      return;
    }
    setLocalError(null);
    setSubmitting(rejectAction);
    const opts = isReview
      ? { note: freeText || undefined, reasonCode: reasonCode.trim() || undefined }
      : { reason: freeText || undefined, reasonCode: reasonCode || undefined };
    const ok = await onDecide(rejectAction, opts);
    setSubmitting(null);
    if (ok) {
      setRejectOpen(false);
      setReasonCode("");
      setFreeText("");
    } else {
      setLocalError("That decision could not be saved — see the notice above.");
    }
  }

  // Shared by the modal's Cancel button, its backdrop click, and Escape (via
  // `useDialogFocusTrap`'s `onCancel`) — identical to what the old inline
  // panel's Cancel button did inline.
  function closeReject() {
    setRejectOpen(false);
    setReasonCode("");
    setFreeText("");
    setLocalError(null);
  }

  useImperativeHandle(ref, () => ({
    focusReject: () => {
      setRejectOpen(true);
      // Focus happens after the modal renders — see the effect below.
    },
    commit: () => {
      if (rejectOpen) {
        void submitReject();
      }
      // Approve/restore is not re-triggered by Enter — `a` already commits
      // it immediately (no staging step), so Enter's job here is only to
      // commit an in-progress reject/hide.
    },
    isRejectOpen: () => rejectOpen,
  }));

  useEffect(() => {
    if (!rejectOpen) return;
    if (isReview) reasonTextRef.current?.focus();
    else reasonSelectRef.current?.focus();
  }, [rejectOpen, isReview]);

  const busy = submitting !== null;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-sm text-ink/70 admin-dark:text-mist/70">
          Reviewing <span className="font-semibold text-ink admin-dark:text-mist">{safeItemTitle}</span>
        </p>
      </div>

      {localError && (
        <p role="alert" className="rounded-lg border border-ember/20 bg-ember/5 px-3 py-2 text-xs text-ember">
          {localError}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <AdminButton variant="primary" disabled={disabled || busy} onClick={submitApprove}>
          {submitting === approveAction ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Check className="h-4 w-4" aria-hidden="true" />
          )}
          {APPROVE_LABEL[kind]}
          <kbd className="ml-1 rounded border border-white/30 px-1 text-[10px] font-data opacity-80">a</kbd>
        </AdminButton>
        <AdminButton variant="dangerOutline" disabled={disabled || busy} onClick={() => setRejectOpen(true)}>
          <X className="h-4 w-4" aria-hidden="true" />
          {REJECT_LABEL[kind]}
          <kbd className="ml-1 rounded border border-ember/25 px-1 text-[10px] font-data text-ember/70">r</kbd>
        </AdminButton>
      </div>

      {rejectOpen && (
        <RejectConfirmModal
          kind={kind}
          itemTitle={safeItemTitle}
          isReview={isReview}
          reasonCodes={reasonCodes}
          reasonCode={reasonCode}
          setReasonCode={setReasonCode}
          freeText={freeText}
          setFreeText={setFreeText}
          localError={localError}
          busy={busy}
          submitting={submitting}
          rejectAction={rejectAction}
          reasonSelectRef={reasonSelectRef}
          reasonTextRef={reasonTextRef}
          onCancel={closeReject}
          onConfirm={submitReject}
        />
      )}
    </div>
  );
});

export default DecisionForm;
