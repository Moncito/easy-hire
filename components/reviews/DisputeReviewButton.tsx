"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { FormEvent } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Flag, X } from "lucide-react";
import { reviewDisputeSchema } from "@/lib/validations/review";

type Props = {
  reviewId: string;
};

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Client component shown only for a review id the viewer is the current
 * subject of (see subjectReviewIdsForViewer in lib/reviews.ts). Opens a
 * keyboard-operable modal — Escape to close, Tab/Shift+Tab trapped inside —
 * validates against the shared reviewDisputeSchema, and POSTs to
 * /api/reviews/[id]/dispute. Surfaces the server's error message verbatim.
 */
export default function DisputeReviewButton({ reviewId }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const headingId = useId();
  const descId = useId();
  const errorId = useId();
  const textareaId = useId();

  useEffect(() => {
    if (!open) return;
    textareaRef.current?.focus();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        if (loading) return;
        event.preventDefault();
        closeModal();
        return;
      }
      if (event.key !== "Tab") return;

      const container = dialogRef.current;
      if (!container) return;
      const focusable = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
    // loading is in the dep array so the effect re-runs and re-registers
    // onKeyDown with a fresh closure whenever it changes — otherwise Escape
    // during a pending submit would still see the stale `loading === false`
    // from when the modal first opened.
  }, [open, loading]);

  function closeModal() {
    setOpen(false);
    setReason("");
    setError(null);
    triggerRef.current?.focus();
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const parsed = reviewDisputeSchema.safeParse({ reason });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please check your dispute reason.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/reviews/${reviewId}/dispute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError((data as { error?: string } | null)?.error ?? "Couldn't submit your dispute. Please try again.");
        setLoading(false);
        return;
      }

      setLoading(false);
      setSubmitted(true);
      setOpen(false);
      router.refresh();
    } catch {
      setError("Couldn't submit your dispute. Please check your connection and try again.");
      setLoading(false);
    }
  }

  if (submitted) {
    return <p className="text-xs font-medium text-ink/45">Dispute submitted — an admin will review it.</p>;
  }

  return (
    <>
      <button
        type="button"
        ref={triggerRef}
        onClick={() => setOpen(true)}
        className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-ink/10 px-3 py-1.5 text-xs font-semibold text-ink/50 transition hover:border-ember/30 hover:text-ember"
      >
        <Flag className="h-3.5 w-3.5" aria-hidden="true" />
        Dispute this review
      </button>

      {open
        ? createPortal(
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
              <button
                type="button"
                className="absolute inset-0 cursor-pointer bg-ink/40 backdrop-blur-xs"
                aria-label="Dismiss"
                onClick={loading ? undefined : closeModal}
              />
              <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={headingId}
                aria-describedby={descId}
                className="relative w-full max-w-md rounded-2xl border border-ink/10 bg-white p-6 shadow-xl"
              >
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={loading}
                  className="absolute right-4 top-4 rounded-lg p-1 text-ink/40 hover:bg-ink/5 hover:text-ink disabled:cursor-not-allowed"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>

                <h2 id={headingId} className="font-display text-lg font-bold text-ink">
                  Dispute this review
                </h2>
                <p id={descId} className="mt-2 text-sm text-ink/55">
                  Tell us what&apos;s inaccurate or unfair. The review stays visible, marked &ldquo;Under
                  review,&rdquo; while an admin looks into it.
                </p>

                <form onSubmit={handleSubmit} className="mt-4" noValidate>
                  <label
                    htmlFor={textareaId}
                    className="block text-xs font-semibold uppercase tracking-wider text-ink/45"
                  >
                    Reason for dispute
                  </label>
                  <textarea
                    id={textareaId}
                    ref={textareaRef}
                    value={reason}
                    onChange={(e) => setReason(e.target.value.slice(0, 1000))}
                    rows={4}
                    required
                    minLength={10}
                    maxLength={1000}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={error ? errorId : undefined}
                    placeholder="Explain why this review is inaccurate or unfair (10 characters minimum)…"
                    className={`mt-2 w-full rounded-xl border p-3 text-sm text-ink outline-none focus:ring-1 ${
                      error
                        ? "border-ember/50 focus:border-ember focus:ring-ember/20"
                        : "border-ink/10 focus:border-navy focus:ring-navy/15"
                    }`}
                  />
                  <p className="mt-1 text-right font-data text-[10px] text-ink/40">{reason.length}/1000</p>

                  {error && (
                    <p id={errorId} role="alert" className="mt-2 text-sm text-ember">
                      {error}
                    </p>
                  )}

                  <div className="mt-5 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={closeModal}
                      disabled={loading}
                      className="rounded-xl border border-ink/10 px-4 py-2.5 text-sm font-semibold text-ink/70 hover:bg-ink/3 disabled:opacity-60"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      aria-busy={loading}
                      className="rounded-xl bg-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy/90 disabled:opacity-60"
                    >
                      {loading ? "Submitting…" : "Submit dispute"}
                    </button>
                  </div>
                </form>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
