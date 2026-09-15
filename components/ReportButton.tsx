"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { FormEvent } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, CheckCircle2, Clock, Flag, Loader2, X } from "lucide-react";
import { useDialogFocusTrap } from "@/components/admin/useDialogFocusTrap";
import type { AbuseReasonEntry, AbuseTargetType } from "@/lib/admin/abuse-reports";

/**
 * Public "Report" control — docs/ADMIN-CONSOLE-PLAN.md §11 Phase 4, Part 3
 * of the trust & safety UI task. Any signed-in user may file a report
 * against a USER, JOB, COMPANY, MESSAGE, or REVIEW via `POST /api/reports`
 * (lib/admin/abuse-reports.ts's `fileAbuseReport`). One reusable component,
 * parameterized by `targetType`/`targetId` — not five bespoke ones.
 *
 * `reasons` is passed in as a prop, sourced from a Server Component that
 * imports `ABUSE_REPORT_REASONS_BY_TARGET_TYPE[targetType]` directly from
 * lib/admin/abuse-reports.ts (safe on the server). This file itself only
 * type-imports from that module — `AbuseReasonEntry`/`AbuseTargetType` are
 * erased at compile time — so this client bundle never pulls in
 * lib/admin/abuse-reports.ts's own `prisma` import.
 *
 * `fileAbuseReport`'s dedup rule (see that function's own doc comment) means
 * a second report from the same reporter against the same target bumps the
 * existing OPEN report's severity rather than erroring — the API returns
 * 201 either way, with no field distinguishing "created" from "bumped". The
 * success copy below is written to be true in both cases rather than
 * implying "this is the first time anyone has reported this."
 *
 * Focus trap reuses the shared `useDialogFocusTrap` hook (same one the admin
 * screens use) rather than forking a second inline implementation.
 */

/** Kept in sync by hand with lib/admin/abuse-reports.ts's own `ABUSE_REPORT_DETAIL_MAX_LENGTH` — same "two independently declared bounds" precedent as that constant's own copy in lib/validations/reports.ts (importing either module here would pull in `prisma`; see this file's header comment). */
const DETAIL_MAX_LENGTH = 2000;

export type ReportButtonProps = {
  targetType: AbuseTargetType;
  targetId: string;
  reasons: readonly AbuseReasonEntry[];
  /** "label" (default) shows a bordered pill with text — fits a sidebar/action row. "icon" is a bare icon button — fits tight spots like a per-message row. */
  variant?: "icon" | "label";
  /** Trigger text (label variant) / aria-label (icon variant). Defaults to "Report". */
  label?: string;
  /** Icon-button footprint. Ignored for the "label" variant. */
  size?: "sm" | "md";
  className?: string;
};

type SubmitState = "idle" | "submitting" | "success" | "rate_limited" | "error";

function targetTypeNoun(targetType: AbuseTargetType): string {
  switch (targetType) {
    case "USER":
      return "profile";
    case "JOB":
      return "job";
    case "COMPANY":
      return "company";
    case "MESSAGE":
      return "message";
    case "REVIEW":
      return "review";
  }
}

export default function ReportButton({
  targetType,
  targetId,
  reasons,
  variant = "label",
  label = "Report",
  size = "md",
  className,
}: ReportButtonProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  function close() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  const iconBox = size === "sm" ? "h-5 w-5" : "h-7 w-7";
  const iconGlyph = size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5";

  const triggerClass =
    variant === "icon"
      ? `inline-flex shrink-0 items-center justify-center rounded-full text-ink/35 transition hover:bg-ember/8 hover:text-ember focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember/40 ${iconBox} ${className ?? ""}`
      : `inline-flex shrink-0 items-center gap-1.5 rounded-full border border-ink/10 px-3 py-1.5 text-xs font-semibold text-ink/50 transition hover:border-ember/30 hover:text-ember focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember/40 ${className ?? ""}`;

  return (
    <>
      <button
        type="button"
        ref={triggerRef}
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-label={variant === "icon" ? label : undefined}
        className={triggerClass}
      >
        <Flag className={`${iconGlyph} shrink-0`} aria-hidden="true" />
        {variant === "label" && label}
      </button>

      {open
        ? createPortal(
            <ReportDialog targetType={targetType} targetId={targetId} reasons={reasons} onClose={close} />,
            document.body
          )
        : null}
    </>
  );
}

function ReportDialog({
  targetType,
  targetId,
  reasons,
  onClose,
}: {
  targetType: AbuseTargetType;
  targetId: string;
  reasons: readonly AbuseReasonEntry[];
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialogFocusTrap(dialogRef, onClose);

  const [reasonCode, setReasonCode] = useState("");
  const [detail, setDetail] = useState("");
  const [state, setState] = useState<SubmitState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryAfterSeconds, setRetryAfterSeconds] = useState<number | null>(null);

  const headingId = useId();
  const descId = useId();
  const errorId = useId();
  const reasonHintId = useId();

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!reasonCode || state === "submitting") return;

    setState("submitting");
    setErrorMessage(null);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType, targetId, reason: reasonCode, detail: detail.trim() || undefined }),
      });

      if (res.status === 429) {
        const retryAfter = res.headers.get("Retry-After");
        setRetryAfterSeconds(retryAfter ? Number(retryAfter) : null);
        setState("rate_limited");
        return;
      }

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setErrorMessage((body as { error?: string } | null)?.error ?? "Couldn't submit this report. Please try again.");
        setState("error");
        return;
      }

      setState("success");
    } catch {
      setErrorMessage("Couldn't submit this report. Please check your connection and try again.");
      setState("error");
    }
  }

  function retryCopy(): string {
    if (!retryAfterSeconds || retryAfterSeconds <= 0) return "Please try again later.";
    const minutes = Math.max(1, Math.ceil(retryAfterSeconds / 60));
    return `Please try again in about ${minutes} minute${minutes === 1 ? "" : "s"}.`;
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 cursor-pointer bg-ink/40 backdrop-blur-xs"
        aria-label="Dismiss"
        onClick={state === "submitting" ? undefined : onClose}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        aria-describedby={descId}
        className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-ink/10 bg-white p-6 shadow-xl"
      >
        <button
          type="button"
          onClick={onClose}
          disabled={state === "submitting"}
          className="absolute right-4 top-4 rounded-lg p-1 text-ink/40 hover:bg-ink/5 hover:text-ink disabled:cursor-not-allowed"
          aria-label="Close"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>

        {state === "success" ? (
          <div role="status" aria-live="polite">
            <div className="flex items-center gap-2 text-teal">
              <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" />
              <h2 id={headingId} className="font-display text-lg font-bold text-ink">
                Report received
              </h2>
            </div>
            <p id={descId} className="mt-2 text-sm text-ink/60">
              Thanks for flagging this — our team will review it. If you&apos;ve already reported this before,
              nothing changes on your end; it&apos;s merged into the existing report rather than filed twice.
            </p>
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy/90"
              >
                Close
              </button>
            </div>
          </div>
        ) : state === "rate_limited" ? (
          <div role="status" aria-live="polite">
            <div className="flex items-center gap-2 text-ember">
              <Clock className="h-5 w-5 shrink-0" aria-hidden="true" />
              <h2 id={headingId} className="font-display text-lg font-bold text-ink">
                Too many reports
              </h2>
            </div>
            <p id={descId} className="mt-2 text-sm text-ink/60">You&apos;ve filed a lot of reports recently. {retryCopy()}</p>
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-ink/10 px-4 py-2 text-sm font-semibold text-ink/70 hover:bg-ink/3"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <h2 id={headingId} className="font-display text-lg font-bold text-ink">
              Report this {targetTypeNoun(targetType)}
            </h2>
            <p id={descId} className="mt-2 text-sm text-ink/55">
              Tell us what&apos;s wrong. Reports go to our team for review — filing one doesn&apos;t notify the
              person or listing you&apos;re reporting.
            </p>

            <fieldset className="mt-4">
              <legend className="text-xs font-semibold uppercase tracking-wider text-ink/45">Reason</legend>
              <div className="mt-2 space-y-1.5">
                {reasons.map((r) => (
                  <label
                    key={r.code}
                    className={`flex cursor-pointer items-start gap-2.5 rounded-xl border px-3 py-2 text-sm transition ${
                      reasonCode === r.code ? "border-navy bg-navy/5" : "border-ink/10 hover:bg-ink/3"
                    }`}
                  >
                    <input
                      type="radio"
                      name="report-reason"
                      value={r.code}
                      checked={reasonCode === r.code}
                      onChange={() => setReasonCode(r.code)}
                      className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-navy"
                    />
                    <span className="text-ink/80">{r.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <label htmlFor="report-detail" className="mt-4 block text-xs font-semibold uppercase tracking-wider text-ink/45">
              Additional detail <span className="font-normal normal-case text-ink/35">(optional)</span>
            </label>
            <textarea
              id="report-detail"
              value={detail}
              onChange={(e) => setDetail(e.target.value.slice(0, DETAIL_MAX_LENGTH))}
              rows={3}
              maxLength={DETAIL_MAX_LENGTH}
              placeholder="Anything that would help our team understand what happened…"
              className="mt-2 w-full rounded-xl border border-ink/10 p-3 text-sm text-ink outline-none focus:border-navy focus:ring-1 focus:ring-navy/15"
            />
            <p className="mt-1 text-right font-data text-[10px] text-ink/40">
              {detail.length}/{DETAIL_MAX_LENGTH}
            </p>

            <p id={reasonHintId} className="sr-only" aria-live="polite">
              {reasonCode ? "" : "Select a reason to enable the submit button."}
            </p>

            {state === "error" && errorMessage && (
              <p id={errorId} role="alert" className="mt-2 flex items-start gap-1.5 text-sm text-ember">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                {errorMessage}
              </p>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={state === "submitting"}
                className="rounded-xl border border-ink/10 px-4 py-2.5 text-sm font-semibold text-ink/70 hover:bg-ink/3 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!reasonCode || state === "submitting"}
                aria-busy={state === "submitting"}
                aria-describedby={reasonHintId}
                className="inline-flex items-center gap-1.5 rounded-xl bg-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {state === "submitting" && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
                {state === "submitting" ? "Submitting…" : "Submit report"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
