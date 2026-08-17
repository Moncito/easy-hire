"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, Copy, X } from "lucide-react";
import { useEmployerShell } from "@/components/employer/EmployerShellContext";
import { useEmployerThemeOptional } from "@/components/employers/EmployerPageThemeProvider";

type Props = {
  open: boolean;
  title: string;
  /** Job name — shown under the title, never stuffed into the headline. */
  subject?: string;
  description: string;
  confirmLabel: string;
  loading?: boolean;
  danger?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

function splitTitle(title: string) {
  const pipe = title.indexOf(" | ");
  return pipe === -1 ? title : title.slice(0, pipe);
}

export default function EmployerConfirmModal({
  open,
  title,
  subject,
  description,
  confirmLabel,
  loading = false,
  danger = false,
  onCancel,
  onConfirm,
}: Props) {
  const { isPro } = useEmployerShell();
  const theme = useEmployerThemeOptional()?.theme;
  const dark = theme === "dark";
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !loading) onCancel();
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, loading, onCancel]);

  if (!open || !mounted) return null;

  const confirmClass = danger
    ? "bg-ember text-white hover:bg-ember/90"
    : isPro
      ? "bg-marigold text-ink hover:bg-marigold/90"
      : "bg-teal text-white hover:bg-teal/95";

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        className="absolute inset-0 cursor-pointer bg-ink/40 backdrop-blur-sm"
        aria-label="Dismiss"
        onClick={loading ? undefined : onCancel}
      />
      <div
        className={`relative w-full max-w-[26rem] overflow-hidden rounded-3xl border shadow-[0_24px_64px_-16px_rgba(32,36,43,0.35)] ${
          dark
            ? "border-white/10 bg-[#1c1f26] text-[#f5f6f4] shadow-black/50"
            : "border-ink/10 bg-white"
        }`}
        role="dialog"
        aria-labelledby="employer-confirm-title"
        aria-describedby="employer-confirm-desc"
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
            <X className="h-4 w-4" />
          </button>

          <div
            className={`flex h-11 w-11 items-center justify-center rounded-full ${
              danger
                ? "bg-ember/10 text-ember"
                : isPro
                  ? dark
                    ? "bg-marigold/15 text-marigold"
                    : "bg-marigold/15 text-[#9A5B12]"
                  : "bg-teal/10 text-teal"
            }`}
            aria-hidden="true"
          >
            {danger ? (
              <AlertTriangle className="h-5 w-5" strokeWidth={2.25} />
            ) : (
              <Copy className="h-5 w-5" strokeWidth={2.25} />
            )}
          </div>

          <h2
            id="employer-confirm-title"
            className={`mt-4 font-display text-xl font-bold tracking-tight ${dark ? "text-[#f5f6f4]" : "text-ink"}`}
          >
            {title}
          </h2>
          {subject ? (
            <p className={`mt-1 line-clamp-2 text-sm font-medium ${dark ? "text-white/70" : "text-ink/70"}`}>
              {splitTitle(subject)}
            </p>
          ) : null}
          <p
            id="employer-confirm-desc"
            className={`mt-2 text-sm leading-relaxed ${dark ? "text-white/50" : "text-ink/50"}`}
          >
            {description}
          </p>
        </div>

        <div
          className={`grid grid-cols-2 gap-3 border-t px-6 py-4 ${
            dark ? "border-white/10 bg-white/5" : "border-ink/[0.06] bg-mist/40"
          }`}
        >
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            autoFocus={danger}
            className={`inline-flex min-h-11 min-w-0 cursor-pointer items-center justify-center rounded-full border px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
              dark
                ? "border-white/10 bg-white/5 text-[#f5f6f4] hover:bg-white/10"
                : "border-ink/10 bg-white text-ink hover:bg-ink/[0.03]"
            }`}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            autoFocus={!danger}
            className={`inline-flex min-h-11 min-w-0 cursor-pointer items-center justify-center rounded-full px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${confirmClass}`}
          >
            {loading ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
