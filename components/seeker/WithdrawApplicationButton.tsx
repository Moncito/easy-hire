"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { AlertTriangle, X } from "lucide-react";
import { withdrawApplication } from "@/lib/client/applications";

type Props = {
  applicationId: string;
  jobId: string;
  jobTitle?: string;
  compact?: boolean;
};

export default function WithdrawApplicationButton({
  applicationId,
  jobId,
  jobTitle,
  compact = false,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !loading) setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, loading]);

  async function handleConfirm() {
    setLoading(true);
    try {
      const result = await withdrawApplication(applicationId);
      if (!result.ok) {
        toast.error(result.data.error || "Could not withdraw the application.");
        return;
      }
      setOpen(false);
      toast.success("Application withdrawn", {
        action: {
          label: "Apply again",
          onClick: () => router.push(`/jobs/${jobId}`),
        },
      });
      router.refresh();
    } catch {
      toast.error("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={compact ? "flex items-center gap-2" : "mt-5 flex flex-wrap items-center gap-3"}>
      <button
        type="button"
        disabled={loading}
        onClick={() => setOpen(true)}
        className={`cursor-pointer font-semibold transition-colors disabled:opacity-60 ${
          compact
            ? "text-xs text-ink/40 hover:text-ember"
            : "rounded-xl border border-ink/10 px-3.5 py-2 text-sm text-ink/60 hover:border-ember/30 hover:text-ember"
        }`}
      >
        Withdraw
      </button>
      {!compact ? (
        <Link
          href={`/jobs/${jobId}`}
          className="text-sm font-semibold text-ink/45 transition-colors hover:text-navy"
        >
          View job
        </Link>
      ) : null}

      {open && mounted
        ? createPortal(
            <div className="fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-6">
              <button
                type="button"
                className="absolute inset-0 cursor-pointer bg-ink/45 backdrop-blur-sm"
                aria-label="Dismiss"
                onClick={loading ? undefined : () => setOpen(false)}
              />
              <div
                className="relative w-full max-w-[26rem] overflow-hidden rounded-t-2xl border border-ink/10 bg-white shadow-[0_24px_64px_-16px_rgba(32,36,43,0.28)] sm:rounded-3xl"
                role="dialog"
                aria-labelledby="withdraw-title"
                aria-describedby="withdraw-desc"
                aria-modal="true"
              >
                <div className="h-1.5 w-full bg-ember/80" />
                <div className="px-6 pb-5 pt-6">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    disabled={loading}
                    className="absolute right-4 top-5 cursor-pointer rounded-full p-1.5 text-ink/35 transition hover:bg-ink/5 hover:text-ink disabled:cursor-not-allowed"
                    aria-label="Close"
                  >
                    <X className="h-4 w-4" />
                  </button>

                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-ember/10 text-ember"
                    aria-hidden="true"
                  >
                    <AlertTriangle className="h-5 w-5" strokeWidth={2.25} />
                  </div>

                  <h2
                    id="withdraw-title"
                    className="mt-4 font-display text-xl font-bold tracking-tight text-ink"
                  >
                    Withdraw this application?
                  </h2>
                  {jobTitle ? (
                    <p className="mt-1 line-clamp-2 text-sm font-medium text-ink/70">{jobTitle}</p>
                  ) : null}
                  <p id="withdraw-desc" className="mt-2 text-sm leading-relaxed text-ink/50">
                    The employer will no longer see it. You can apply to this role again afterwards.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 border-t border-ink/[0.06] bg-mist/40 px-6 py-4">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    disabled={loading}
                    className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-xl border border-ink/10 bg-white px-4 text-sm font-semibold text-ink transition hover:bg-ink/[0.03] disabled:opacity-60"
                  >
                    Keep it
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleConfirm()}
                    disabled={loading}
                    className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-xl bg-ember px-4 text-sm font-semibold text-white transition hover:bg-ember/90 disabled:opacity-60"
                  >
                    {loading ? "Withdrawing…" : "Withdraw"}
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
