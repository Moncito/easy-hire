"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { toast } from "sonner";
import { CheckCircle2, Loader2, X } from "lucide-react";

type Props = {
  jobId: string;
  jobTitle: string;
  companyName: string;
};

export default function ApplyButton({ jobId, jobTitle, companyName }: Props) {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const [coverNote, setCoverNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");
  const [applied, setApplied] = useState(false);
  const [justSubmitted, setJustSubmitted] = useState(false);
  const [hasResume, setHasResume] = useState<boolean | null>(null);

  useEffect(() => {
    if (session?.user?.role !== "SEEKER") return;
    fetch(`/api/applications?jobId=${jobId}`)
      .then((r) => r.json())
      .then((apps) => {
        if (apps.application) setApplied(true);
      })
      .catch(() => {});
  }, [jobId, session?.user?.role]);

  async function openApplyModal() {
    if (session?.user?.role !== "SEEKER") return;
    setOpen(true);
    setChecking(true);
    setError("");

    try {
      const [apps, profile] = await Promise.all([
        fetch(`/api/applications?jobId=${jobId}`).then((r) => r.json()),
        fetch("/api/profile/seeker").then((r) => r.json()),
      ]);

      if (apps.application) {
        setApplied(true);
        if (!justSubmitted) {
          toast.message("You already applied to this role");
        }
      }
      setHasResume(!!profile.resumeUrl);
    } finally {
      setChecking(false);
    }
  }

  async function submitApplication() {
    setError("");
    setLoading(true);

    const res = await fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId, coverNote: coverNote.trim() || null }),
    });

    const result = await res.json();
    setLoading(false);

    if (!res.ok) {
      const msg = result.error || "Application failed";
      setError(msg);
      toast.error(msg);
      if (res.status === 409) setApplied(true);
      return;
    }

    setApplied(true);
    setJustSubmitted(true);
    toast.success("Application submitted — check your email for confirmation");
  }

  const btnBase =
    "mt-4 block w-full cursor-pointer rounded-xl py-2.5 text-center text-sm font-semibold transition";

  if (status === "loading") {
    return (
      <button type="button" disabled className={`${btnBase} bg-marigold/60 text-ink`}>
        Loading...
      </button>
    );
  }

  if (!session?.user) {
    return (
      <Link
        href={`/login?callbackUrl=/jobs/${jobId}`}
        className={`${btnBase} bg-marigold text-ink shadow-sm hover:bg-marigold/90`}
      >
        Log in to apply
      </Link>
    );
  }

  if (session.user.role === "EMPLOYER") {
    return (
      <p className="mt-4 rounded-xl bg-mist px-4 py-3 text-center text-sm text-ink/55">
        Switch to a seeker account to apply.
      </p>
    );
  }

  if (session.user.role !== "SEEKER") {
    return null;
  }

  if (applied && !open) {
    return (
      <button
        type="button"
        disabled
        className={`${btnBase} cursor-default border border-navy/15 bg-mist text-ink/60`}
      >
        Applied
      </button>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => void openApplyModal()}
        className={`${btnBase} bg-marigold text-ink shadow-sm hover:bg-marigold/90`}
      >
        Apply now
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/45 p-4 backdrop-blur-sm">
          <div
            className="relative w-full max-w-md overflow-hidden rounded-2xl border border-ink/5 bg-white shadow-2xl animate-scale-in"
            role="dialog"
            aria-modal="true"
            aria-labelledby="apply-modal-title"
          >
            <div className="h-1.5 w-full bg-marigold" />
            <div className="p-6">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h2 id="apply-modal-title" className="font-display text-lg font-bold text-ink">
                    Apply to {jobTitle}
                  </h2>
                  <p className="mt-1 text-sm text-ink/55">{companyName}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="cursor-pointer rounded-lg p-1 text-ink/40 hover:bg-ink/5 hover:text-ink"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {checking ? (
                <div className="flex items-center justify-center py-10 text-ink/50">
                  <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
                </div>
              ) : applied ? (
                <div className="rounded-xl bg-marigold/8 px-4 py-6 text-center">
                  <CheckCircle2 className="mx-auto h-9 w-9 text-marigold" aria-hidden="true" />
                  <p className="mt-3 font-display text-lg font-bold text-ink">
                    {justSubmitted ? "Application submitted" : "Already applied"}
                  </p>
                  <p className="mt-1 text-sm text-ink/55">
                    The employer will review your profile soon.
                  </p>
                  <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
                    <Link
                      href="/seeker/dashboard"
                      className="cursor-pointer rounded-xl bg-marigold px-4 py-2.5 text-sm font-semibold text-ink"
                    >
                      View applications
                    </Link>
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      className="cursor-pointer rounded-xl border border-ink/10 px-4 py-2.5 text-sm font-semibold text-ink/70 hover:bg-ink/4"
                    >
                      Done
                    </button>
                  </div>
                </div>
              ) : hasResume === false ? (
                <div className="rounded-xl bg-marigold/10 px-4 py-5">
                  <p className="font-semibold text-ink">Upload your resume first</p>
                  <p className="mt-1 text-sm text-ink/60">
                    You need a resume on your profile before applying.
                  </p>
                  <Link
                    href="/seeker/profile"
                    className="mt-4 inline-block cursor-pointer rounded-xl bg-marigold px-4 py-2 text-sm font-semibold text-ink"
                  >
                    Go to profile
                  </Link>
                </div>
              ) : (
                <>
                  <label htmlFor="coverNote" className="mb-2 block text-sm font-medium text-ink">
                    Cover note <span className="text-ink/40">(optional)</span>
                  </label>
                  <textarea
                    id="coverNote"
                    rows={4}
                    value={coverNote}
                    onChange={(e) => setCoverNote(e.target.value)}
                    placeholder="Why are you a great fit for this role?"
                    className="w-full resize-y rounded-xl border border-ink/10 px-4 py-3 text-sm text-ink outline-none focus:border-marigold focus:ring-2 focus:ring-marigold/20"
                  />
                  {error && <p className="mt-3 text-sm text-ember">{error}</p>}
                  <div className="mt-5 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      className="flex-1 cursor-pointer rounded-xl border border-ink/10 py-2.5 text-sm font-semibold text-ink/70 hover:bg-ink/4"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => void submitApplication()}
                      className="flex-1 cursor-pointer rounded-xl bg-marigold py-2.5 text-sm font-semibold text-ink hover:bg-marigold/90 disabled:opacity-60"
                    >
                      {loading ? "Submitting..." : "Submit application"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
