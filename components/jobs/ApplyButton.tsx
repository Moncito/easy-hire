"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { toast } from "sonner";
import {
  getApplicationForJob,
  getSeekerProfileForApply,
  submitApplication as submitApplicationApi,
} from "@/lib/client/applications";
import { CheckCircle2, Loader2, X } from "lucide-react";

type Props = {
  jobId: string;
  jobTitle: string;
  companyName: string;
  screeningQuestions?: {
    id: string;
    prompt: string;
    required: boolean;
  }[];
};

const COVER_NOTE_MAX = 2000;
const ANSWER_MAX = 1000;

export default function ApplyButton({
  jobId,
  jobTitle,
  companyName,
  screeningQuestions = [],
}: Props) {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const [coverNote, setCoverNote] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");
  const [applied, setApplied] = useState(false);
  const [justSubmitted, setJustSubmitted] = useState(false);
  const [hasResume, setHasResume] = useState<boolean | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (session?.user?.role !== "SEEKER") return;
    getApplicationForJob(jobId)
      .then((apps) => {
        if (apps.application) setApplied(true);
      })
      .catch(() => {});
  }, [jobId, session?.user?.role]);

  useEffect(() => {
    if (!open) return;

    dialogRef.current?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
        return;
      }

      if (e.key !== "Tab" || !dialogRef.current) return;

      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  function closeModal() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  async function openApplyModal() {
    if (session?.user?.role !== "SEEKER") return;
    setOpen(true);
    setChecking(true);
    setError("");

    try {
      const [apps, profile] = await Promise.all([
        getApplicationForJob(jobId),
        getSeekerProfileForApply(),
      ]);

      if (!profile) {
        throw new Error("Could not load your application details. Please try again.");
      }

      if (apps.application) {
        setApplied(true);
        if (!justSubmitted) {
          toast.message("You already applied to this role");
        }
      }
      setHasResume(!!profile.resumeUrl);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Could not load your application details.";
      setError(msg);
      toast.error(msg);
      setHasResume(false);
    } finally {
      setChecking(false);
    }
  }

  async function handleSubmitApplication() {
    setError("");

    const missingRequired = screeningQuestions.filter(
      (q) => q.required && !(answers[q.id]?.trim())
    );
    if (missingRequired.length > 0) {
      setError("Please answer all required screening questions.");
      toast.error("Please answer all required screening questions.");
      return;
    }

    setLoading(true);

    try {
      const result = await submitApplicationApi({
        jobId,
        coverNote: coverNote.trim() || null,
        answers: screeningQuestions
          .map((q) => ({
            questionId: q.id,
            answerText: (answers[q.id] || "").trim(),
          }))
          .filter((a) => a.answerText.length > 0),
      });

      if (!result.ok) {
        const msg = result.data.error || "Application failed";
        setError(msg);
        toast.error(msg);
        if (result.status === 409) setApplied(true);
        return;
      }

      setApplied(true);
      setJustSubmitted(true);
      toast.success("Application submitted — check your email for confirmation");
    } catch {
      const msg = "Network error — please try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
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
        ref={triggerRef}
        type="button"
        onClick={() => void openApplyModal()}
        className={`${btnBase} bg-marigold text-ink shadow-sm hover:bg-marigold/90`}
      >
        Apply now
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 p-0 backdrop-blur-sm sm:items-center sm:p-6">
          <div
            ref={dialogRef}
            tabIndex={-1}
            className="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-ink/5 bg-white shadow-2xl animate-scale-in outline-none sm:rounded-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="apply-modal-title"
          >
            <div className="h-1.5 w-full shrink-0 bg-marigold" />
            <div className="overflow-y-auto p-6 sm:p-8">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-marigold">Apply for this role</p>
                  <h2 id="apply-modal-title" className="mt-1 font-display text-xl font-bold text-ink sm:text-2xl">
                    {jobTitle}
                  </h2>
                  <p className="mt-1 text-sm text-ink/55">{companyName}</p>
                </div>
                <button
                  type="button"
                  onClick={closeModal}
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
                      onClick={closeModal}
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
                  <div className="rounded-xl border border-navy/10 bg-mist/50 p-4 text-sm text-ink/65">
                    <p className="font-semibold text-ink">Your application includes</p>
                    <ul className="mt-2 space-y-1 text-xs">
                      <li>• Profile photo, headline, and skills</li>
                      <li>• Resume on file</li>
                      <li>• Cover letter below (recommended)</li>
                    </ul>
                  </div>

                  <label htmlFor="coverNote" className="mb-2 mt-6 block text-sm font-semibold text-ink">
                    Cover letter
                  </label>
                  <p className="mb-3 text-xs text-ink/50">
                    Tell the employer why you&apos;re a strong fit — experience, tools, timezone, and availability.
                  </p>
                  <textarea
                    id="coverNote"
                    rows={8}
                    maxLength={COVER_NOTE_MAX}
                    value={coverNote}
                    onChange={(e) => setCoverNote(e.target.value)}
                    placeholder="Dear hiring team,

I'm excited to apply because...

• Relevant experience:
• Tools I use daily:
• Why this role fits me:"
                    className="w-full resize-y rounded-xl border border-ink/10 px-4 py-3.5 text-sm leading-relaxed text-ink outline-none focus:border-marigold focus:ring-2 focus:ring-marigold/20"
                  />
                  <p className="mt-2 text-right font-data text-xs text-ink/40">
                    {coverNote.length}/{COVER_NOTE_MAX}
                  </p>

                  {screeningQuestions.length > 0 && (
                    <div className="mt-6 space-y-4">
                      <div>
                        <p className="text-sm font-semibold text-ink">Employer questions</p>
                        <p className="mt-1 text-xs text-ink/50">
                          Short answers only — nothing here auto-rejects your application.
                        </p>
                      </div>
                      {screeningQuestions.map((question) => (
                        <div key={question.id}>
                          <label
                            htmlFor={`screening-${question.id}`}
                            className="mb-2 block text-sm font-medium text-ink"
                          >
                            {question.prompt}
                            {question.required && (
                              <span className="ml-1 text-ember" aria-hidden="true">
                                *
                              </span>
                            )}
                          </label>
                          <textarea
                            id={`screening-${question.id}`}
                            rows={3}
                            maxLength={ANSWER_MAX}
                            required={question.required}
                            value={answers[question.id] || ""}
                            onChange={(e) =>
                              setAnswers((prev) => ({
                                ...prev,
                                [question.id]: e.target.value,
                              }))
                            }
                            className="w-full resize-y rounded-xl border border-ink/10 px-4 py-3 text-sm leading-relaxed text-ink outline-none focus:border-marigold focus:ring-2 focus:ring-marigold/20"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {error && <p className="mt-3 text-sm text-ember">{error}</p>}
                  <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="flex-1 cursor-pointer rounded-xl border border-ink/10 py-3 text-sm font-semibold text-ink/70 hover:bg-ink/4"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => void handleSubmitApplication()}
                      className="flex-1 cursor-pointer rounded-xl bg-marigold py-3 text-sm font-semibold text-ink shadow-sm hover:bg-marigold/90 disabled:opacity-60"
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
