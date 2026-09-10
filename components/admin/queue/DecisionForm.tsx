"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Check, Loader2, X } from "lucide-react";
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
  /** `r` shortcut — opens the reject/hide panel and focuses the reason control. */
  focusReject: () => void;
  /** `Enter` shortcut — commits whatever is currently staged (see ReviewQueue's keydown handler for the exact rule). */
  commit: () => void;
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
};

const REJECT_LABEL: Record<QueueKind, string> = {
  COMPANY: "Reject",
  JOB: "Reject",
  SEEKER: "Reject",
  REVIEW: "Hide review",
};

const DecisionForm = forwardRef<DecisionFormHandle, DecisionFormProps>(function DecisionForm(
  { kind, itemId, itemTitle, reasonCodes, disabled, onDecide },
  ref
) {
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reasonCode, setReasonCode] = useState("");
  const [freeText, setFreeText] = useState("");
  const [submitting, setSubmitting] = useState<DecisionAction | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const reasonSelectRef = useRef<HTMLSelectElement>(null);
  const reasonTextRef = useRef<HTMLInputElement>(null);

  const isReview = kind === "REVIEW";
  const approveAction: DecisionAction = isReview ? "restore" : "approve";
  const rejectAction: DecisionAction = isReview ? "hide" : "reject";

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

  useImperativeHandle(ref, () => ({
    focusReject: () => {
      setRejectOpen(true);
      // Focus happens after the panel renders — see the effect below.
    },
    commit: () => {
      if (rejectOpen) {
        void submitReject();
      }
      // Approve/restore is not re-triggered by Enter — `a` already commits
      // it immediately (no staging step), so Enter's job here is only to
      // commit an in-progress reject/hide.
    },
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
        <h3 className="font-display text-sm font-bold uppercase tracking-wider text-ink/50">Decision</h3>
        <p className="mt-1 text-sm text-ink/70">
          Reviewing <span className="font-semibold text-ink">{itemTitle}</span>
        </p>
      </div>

      {localError && (
        <p role="alert" className="rounded-lg border border-ember/20 bg-ember/5 px-3 py-2 text-xs text-ember">
          {localError}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={disabled || busy}
          onClick={submitApprove}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-teal px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal/95 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2"
        >
          {submitting === approveAction ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Check className="h-4 w-4" aria-hidden="true" />
          )}
          {APPROVE_LABEL[kind]}
          <kbd className="ml-1 rounded border border-white/30 px-1 text-[10px] font-data opacity-80">a</kbd>
        </button>
        <button
          type="button"
          disabled={disabled || busy}
          onClick={() => setRejectOpen(true)}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-ink/10 px-4 py-2.5 text-sm font-semibold text-ink/70 hover:bg-ink/4 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2"
        >
          <X className="h-4 w-4" aria-hidden="true" />
          {REJECT_LABEL[kind]}
          <kbd className="ml-1 rounded border border-ink/15 px-1 text-[10px] font-data text-ink/50">r</kbd>
        </button>
      </div>

      {rejectOpen && (
        <div className="rounded-xl border border-ink/10 bg-mist/60 p-4">
          {isReview ? (
            <>
              <label htmlFor="reason-code-free" className="mb-1 block text-xs font-semibold text-ink/70">
                Reason code <span className="font-normal text-ink/40">(optional, max 64 characters)</span>
              </label>
              <input
                ref={reasonTextRef}
                id="reason-code-free"
                type="text"
                maxLength={64}
                value={reasonCode}
                onChange={(e) => setReasonCode(e.target.value)}
                placeholder="e.g. FABRICATED_CLAIM"
                className="w-full rounded-lg border border-ink/10 px-3 py-2 text-sm outline-none focus:border-navy focus:ring-2 focus:ring-navy/20"
              />
            </>
          ) : (
            <>
              <label htmlFor="reason-code-select" className="mb-1 block text-xs font-semibold text-ink/70">
                Reason code <span className="text-ember">*</span>
              </label>
              <select
                ref={reasonSelectRef}
                id="reason-code-select"
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

          <label htmlFor="reason-note" className="mb-1 mt-3 block text-xs font-semibold text-ink/70">
            {isReview ? "Note" : "Note to the employer"} <span className="font-normal text-ink/40">(optional)</span>
          </label>
          <textarea
            id="reason-note"
            rows={3}
            maxLength={500}
            value={freeText}
            onChange={(e) => setFreeText(e.target.value)}
            placeholder="Add context for the record…"
            className="w-full resize-y rounded-lg border border-ink/10 px-3 py-2 text-sm outline-none focus:border-navy focus:ring-2 focus:ring-navy/20"
          />

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => {
                setRejectOpen(false);
                setReasonCode("");
                setFreeText("");
                setLocalError(null);
              }}
              className="rounded-xl border border-ink/10 px-4 py-2 text-sm font-semibold text-ink/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={submitReject}
              className="inline-flex items-center gap-1.5 rounded-xl bg-ember px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember focus-visible:ring-offset-2"
            >
              {submitting === rejectAction && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
              Confirm {REJECT_LABEL[kind].toLowerCase()}
              <kbd className="ml-1 rounded border border-white/30 px-1 text-[10px] font-data opacity-80">Enter</kbd>
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

export default DecisionForm;
