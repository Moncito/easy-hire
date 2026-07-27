"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
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
  const [hasResume, setHasResume] = useState<boolean | null>(null);

  useEffect(() => {
    if (!open || session?.user?.role !== "SEEKER") return;

    setChecking(true);
    Promise.all([
      fetch(`/api/applications?jobId=${jobId}`).then((r) => r.json()),
      fetch("/api/profile/seeker").then((r) => r.json()),
    ])
      .then(([apps, profile]) => {
        if (apps.application) setApplied(true);
        setHasResume(!!profile.resumeUrl);
      })
      .finally(() => setChecking(false));
  }, [open, jobId, session?.user?.role]);

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
      setError(result.error || "Application failed");
      if (res.status === 409) setApplied(true);
      return;
    }

    setApplied(true);
  }

  if (status === "loading") {
    return (
      <button
        type="button"
        disabled
        className="mt-4 block w-full rounded-xl bg-marigold/60 py-2.5 text-center text-sm font-semibold text-ink"
      >
        Loading...
      </button>
    );
  }

  if (!session?.user) {
    return (
      <Link
        href={`/login?callbackUrl=/jobs/${jobId}`}
        className="mt-4 block w-full rounded-xl bg-marigold py-2.5 text-center text-sm font-semibold text-ink shadow-sm hover:bg-marigold/90"
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

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-4 block w-full rounded-xl bg-marigold py-2.5 text-center text-sm font-semibold text-ink shadow-sm hover:bg-marigold/90"
      >
        Apply now
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm">
          <div
            className="w-full max-w-md rounded-2xl border border-ink/5 bg-white p-6 shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="apply-modal-title"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 id="apply-modal-title" className="font-display text-lg font-bold text-ink">
                  Apply to this job
                </h2>
                <p className="mt-1 text-sm text-ink/55">
                  {jobTitle} · {companyName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 text-ink/40 hover:bg-ink/5 hover:text-ink"
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
              <div className="rounded-xl bg-teal/8 px-4 py-6 text-center">
                <CheckCircle2 className="mx-auto h-8 w-8 text-teal" aria-hidden="true" />
                <p className="mt-3 font-semibold text-ink">Application submitted</p>
                <p className="mt-1 text-sm text-ink/55">The employer will review your profile soon.</p>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="mt-4 rounded-xl bg-teal px-4 py-2 text-sm font-semibold text-white"
                >
                  Done
                </button>
              </div>
            ) : hasResume === false ? (
              <div className="rounded-xl bg-marigold/10 px-4 py-5">
                <p className="font-semibold text-ink">Upload your resume first</p>
                <p className="mt-1 text-sm text-ink/60">
                  You need a resume on your profile before applying.
                </p>
                <Link
                  href="/seeker/profile"
                  className="mt-4 inline-block rounded-xl bg-marigold px-4 py-2 text-sm font-semibold text-ink"
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
                    className="flex-1 rounded-xl border border-ink/10 py-2.5 text-sm font-semibold text-ink/70 hover:bg-ink/4"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => void submitApplication()}
                    className="flex-1 rounded-xl bg-marigold py-2.5 text-sm font-semibold text-ink hover:bg-marigold/90 disabled:opacity-60"
                  >
                    {loading ? "Submitting..." : "Submit application"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
