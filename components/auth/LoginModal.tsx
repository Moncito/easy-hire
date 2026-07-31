"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import LoginForm from "@/components/auth/LoginForm";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function LoginModal({ open, onClose }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    dialogRef.current?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-ink/50 p-0 backdrop-blur-sm sm:items-center sm:p-6">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close login dialog"
        onClick={onClose}
      />
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-modal-title"
        className="relative flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl border border-ink/5 bg-white shadow-2xl outline-none animate-scale-in sm:rounded-2xl"
      >
        <div className="h-1.5 w-full shrink-0 bg-marigold" />
        <div className="overflow-y-auto p-6 sm:p-8">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-marigold">Welcome back</p>
              <h2 id="login-modal-title" className="mt-1 font-display text-xl font-bold text-ink sm:text-2xl">
                Sign in to EasyHire
              </h2>
              <p className="mt-1 text-sm text-ink/55">Pick up where you left off — jobs, profile, applications.</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-lg p-1 text-ink/40 hover:bg-ink/5 hover:text-ink"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <LoginForm idPrefix="modal-login" onSuccess={onClose} />
        </div>
      </div>
    </div>
  );
}
