"use client";

import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { UserCheck, X } from "lucide-react";
import { useEmployerShell } from "@/components/employer/EmployerShellContext";
import { useEmployerThemeOptional } from "@/components/employers/EmployerPageThemeProvider";
import { firstName } from "@/components/employer/candidate-detail/offer-view";

type Props = {
  open: boolean;
  candidateNames: string[];
  /** The candidate (single case) already has an unexpired offer out. */
  hasOpenOffer: boolean;
  /** Single candidate only: closes this dialog and opens the offer form. */
  onSendOffer?: () => void;
  onMarkHired: () => void;
  onCancel: () => void;
  loading?: boolean;
};

/**
 * Asked when an employer marks someone Hired: send an offer (the hire is then
 * verified when the candidate accepts) or mark hired without one.
 */
export default function HireChoiceModal({
  open,
  candidateNames,
  hasOpenOffer,
  onSendOffer,
  onMarkHired,
  onCancel,
  loading = false,
}: Props) {
  const { isPro } = useEmployerShell();
  const theme = useEmployerThemeOptional()?.theme;
  const dark = theme === "dark";
  const uid = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef(onCancel);
  const loadingRef = useRef(loading);
  // Only ever opened by a click, never on the server render, so checking for
  // the DOM directly is enough to gate the portal (no mounted-state effect).
  const mounted = typeof document !== "undefined";

  useEffect(() => {
    cancelRef.current = onCancel;
    loadingRef.current = loading;
  });

  // Scroll lock, Esc, a Tab loop inside the dialog, and focus return.
  useEffect(() => {
    if (!open || !mounted) return;
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    dialogRef.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (!loadingRef.current) cancelRef.current();
        return;
      }
      if (e.key !== "Tab") return;
      const focusable = Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>("button:not([disabled])") ?? []
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      } else if (!dialogRef.current?.contains(active)) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKey);
      previousFocus?.focus?.();
    };
  }, [open, mounted]);

  if (!open || !mounted) return null;

  const bulk = candidateNames.length > 1;
  const name = candidateNames[0] ?? "this candidate";
  const first = firstName(name);

  const title = bulk ? `Mark ${candidateNames.length} candidates hired?` : `Hire ${name}?`;
  const body = bulk
    ? "Offers are sent one candidate at a time. Marking hired here skips offers, so these hires won't be verified."
    : hasOpenOffer
      ? `${first} has an open offer. Marking hired now skips their answer and the hire won't be verified.`
      : `Send an offer and the hire is verified when ${first} accepts. Verified hires can be protected by the replacement guarantee when it launches.`;

  const primaryClass = isPro
    ? "bg-marigold text-ink hover:bg-marigold/90"
    : "bg-teal text-white hover:bg-teal/95";
  const secondaryClass = dark
    ? "border border-white/10 bg-white/5 text-[#f5f6f4] hover:bg-white/10"
    : "border border-ink/10 bg-white text-ink hover:bg-ink/[0.03]";
  const tertiaryClass = dark
    ? "text-white/60 hover:bg-white/10 hover:text-[#f5f6f4]"
    : "text-ink/60 hover:bg-ink/5 hover:text-ink";
  const buttonBase =
    "inline-flex min-h-11 w-full cursor-pointer items-center justify-center rounded-full px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60";

  const titleId = `${uid}-title`;
  const descId = `${uid}-desc`;

  // Which action is the primary (autofocused, filled) one.
  const primary =
    bulk ? (
      <button
        type="button"
        data-autofocus
        onClick={onMarkHired}
        disabled={loading}
        className={`${buttonBase} ${primaryClass}`}
      >
        {loading ? "Working…" : "Mark hired"}
      </button>
    ) : hasOpenOffer ? (
      <button type="button" data-autofocus onClick={onCancel} disabled={loading} className={`${buttonBase} ${primaryClass}`}>
        Wait for their answer
      </button>
    ) : (
      <button
        type="button"
        data-autofocus
        onClick={onSendOffer}
        disabled={loading || !onSendOffer}
        className={`${buttonBase} ${primaryClass}`}
      >
        Send an offer
      </button>
    );

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        tabIndex={-1}
        className="absolute inset-0 cursor-pointer bg-ink/40 backdrop-blur-sm"
        aria-label="Dismiss"
        onClick={loading ? undefined : onCancel}
      />
      <div
        ref={dialogRef}
        className={`relative w-full max-w-[26rem] overflow-hidden rounded-3xl border shadow-[0_24px_64px_-16px_rgba(32,36,43,0.35)] ${
          dark ? "border-white/10 bg-[#1c1f26] text-[#f5f6f4] shadow-black/50" : "border-ink/10 bg-white"
        }`}
        role="dialog"
        aria-labelledby={titleId}
        aria-describedby={descId}
        aria-modal="true"
      >
        <div className="px-6 pb-5 pt-6">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className={`absolute right-4 top-4 cursor-pointer rounded-full p-1.5 transition disabled:cursor-not-allowed ${
              dark
                ? "text-white/40 hover:bg-white/10 hover:text-[#f5f6f4]"
                : "text-ink/35 hover:bg-ink/5 hover:text-ink"
            }`}
            aria-label="Close"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>

          <div
            className={`flex h-11 w-11 items-center justify-center rounded-full ${
              isPro
                ? dark
                  ? "bg-marigold/15 text-marigold"
                  : "bg-marigold/15 text-[#9A5B12]"
                : "bg-teal/10 text-teal"
            }`}
            aria-hidden="true"
          >
            <UserCheck className="h-5 w-5" strokeWidth={2.25} />
          </div>

          <h2
            id={titleId}
            className={`mt-4 font-display text-xl font-bold tracking-tight ${dark ? "text-[#f5f6f4]" : "text-ink"}`}
          >
            {title}
          </h2>
          <p id={descId} className={`mt-2 text-sm leading-relaxed ${dark ? "text-white/50" : "text-ink/50"}`}>
            {body}
          </p>
        </div>

        <div
          className={`flex flex-col gap-2 border-t px-6 py-4 ${
            dark ? "border-white/10 bg-white/5" : "border-ink/[0.06] bg-mist/40"
          }`}
        >
          {primary}
          {!bulk ? (
            <button
              type="button"
              onClick={onMarkHired}
              disabled={loading}
              className={`${buttonBase} ${secondaryClass}`}
            >
              {loading ? "Working…" : hasOpenOffer ? "Mark hired anyway" : "Mark hired without an offer"}
            </button>
          ) : null}
          <button type="button" onClick={onCancel} disabled={loading} className={`${buttonBase} ${tertiaryClass}`}>
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
