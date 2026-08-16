"use client";

import { useState } from "react";
import { CheckCircle2, X } from "lucide-react";
import ProBadge from "@/components/employer/pro/ProBadge";

const STORAGE_KEY = "easyhire-pro-upgrade-welcome-dismissed";

type Props = {
  /** Server-verified: URL `?upgraded=1` and plan === PRO. */
  show: boolean;
};

/**
 * Post-checkout welcome banner. Only mounts when billing page confirms Pro + upgraded URL.
 * Dismissal is client-only (sessionStorage) — no server session mutation.
 */
export default function BillingUpgradeWelcome({ show }: Props) {
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return sessionStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  });

  if (!show || dismissed) return null;

  function dismiss() {
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    setDismissed(true);
  }

  return (
    <div className="pro-card mb-8 border-marigold/25 bg-marigold/10 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#9A5B12]" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-ink">
            Welcome to Employer Pro
            <ProBadge size="sm" />
          </p>
          <p className="mt-0.5 text-sm text-ink/55">
            Your upgrade is active. Easy AI, reports, and CSV are available now. Complete company
            verification to unlock instant job publishing — Pro never skips that step.
          </p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 rounded-lg p-1.5 text-ink/40 transition hover:bg-ink/5 hover:text-ink/65"
          aria-label="Dismiss welcome message"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
