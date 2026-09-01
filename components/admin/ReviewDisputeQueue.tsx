"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Flag, Check, EyeOff, Mail, Briefcase } from "lucide-react";
import StarRating from "@/components/reviews/StarRating";

export type DisputedReviewRow = {
  id: string;
  direction: "SEEKER_TO_COMPANY" | "COMPANY_TO_SEEKER";
  rating: number;
  body: string;
  disputeReason: string | null;
  disputedAt: string | null;
  submittedAt: string;
  author: { id: string; email: string };
  subjectCompanyId: string | null;
  subjectSeekerId: string | null;
  application: {
    id: string;
    job: {
      id: string;
      title: string;
      company: { id: string; companyName: string; logoUrl: string | null };
    };
    seeker: { id: string; fullName: string; headline: string | null; photoUrl: string | null };
  };
};

type Props = {
  initialReviews: DisputedReviewRow[];
};

type PendingAction = { reviewId: string; action: "restore" | "hide" } | null;

export default function ReviewDisputeQueue({ initialReviews }: Props) {
  const router = useRouter();
  const [reviews, setReviews] = useState(initialReviews);
  const [pending, setPending] = useState<PendingAction>(null);
  const [note, setNote] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function resolve(reviewId: string, action: "restore" | "hide") {
    setError("");
    setLoadingId(reviewId);

    const res = await fetch(`/api/admin/reviews/${reviewId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, note: note.trim() || undefined }),
    });

    const result = await res.json().catch(() => null);
    setLoadingId(null);

    if (!res.ok) {
      setError((result as { error?: string } | null)?.error ?? "Action failed");
      return;
    }

    setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    setPending(null);
    setNote("");
    router.refresh();
  }

  if (reviews.length === 0) {
    return (
      <div className="rounded-2xl border border-ink/5 bg-white p-12 text-center shadow-xs">
        <Check className="mx-auto mb-3 h-8 w-8 text-teal" aria-hidden="true" />
        <h2 className="font-display text-lg font-bold text-ink">All caught up</h2>
        <p className="mt-1 text-sm text-ink/50">No disputed reviews are waiting for a decision.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-xl border border-ember/20 bg-ember/5 px-4 py-3 text-sm text-ember">{error}</div>
      )}

      <div className="rounded-xl border border-navy/10 bg-navy/5 px-4 py-3 text-sm text-ink/70">
        <strong className="text-ink">Restore</strong> republishes the review on both public profiles —
        use it when the dispute doesn&apos;t hold up. <strong className="text-ink">Hide</strong> takes it
        off both public profiles, but the row is kept for audit history, not deleted.
      </div>

      {reviews.map((review) => {
        const isSeekerAuthor = review.direction === "SEEKER_TO_COMPANY";
        const author = isSeekerAuthor
          ? { name: review.application.seeker.fullName, role: "Seeker (author)" }
          : { name: review.application.job.company.companyName, role: "Employer (author)" };
        const subject = isSeekerAuthor
          ? { name: review.application.job.company.companyName, role: "Employer (subject)" }
          : { name: review.application.seeker.fullName, role: "Seeker (subject)" };
        const accent = isSeekerAuthor ? "marigold" : "teal";
        // Captured (not just a boolean) so the JSX below can read `.action`
        // without TS losing the null-narrowing on the shared `pending` state.
        const activePending = pending && pending.reviewId === review.id ? pending : null;

        return (
          <article
            key={review.id}
            className="rounded-2xl border border-ink/5 bg-white p-6 shadow-xs transition-shadow hover:shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-ember/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ember">
                    Disputed
                  </span>
                  <StarRating value={review.rating} size="sm" accent={accent} />
                </div>
                <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-ink/55">
                  <Briefcase className="h-3.5 w-3.5" aria-hidden="true" />
                  {review.application.job.title}
                </p>
              </div>
              <span className="shrink-0 font-data text-[11px] text-ink/40">
                Disputed {review.disputedAt ? new Date(review.disputedAt).toLocaleDateString() : "—"}
              </span>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-mist/80 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-ink/45">{author.role}</p>
                <p className="mt-0.5 text-sm font-semibold text-ink">{author.name}</p>
                <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-ink/45">
                  <Mail className="h-3 w-3" aria-hidden="true" />
                  {review.author.email}
                </p>
              </div>
              <div className="rounded-xl bg-mist/80 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-ink/45">{subject.role}</p>
                <p className="mt-0.5 text-sm font-semibold text-ink">{subject.name}</p>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-ink/45">Review body</p>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-ink/70">{review.body}</p>
            </div>

            <div className="mt-4 rounded-xl border border-ember/15 bg-ember/[0.04] p-3">
              <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-ember/80">
                <Flag className="h-3.5 w-3.5" aria-hidden="true" />
                Dispute reason
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-ink/70">
                {review.disputeReason ?? "No reason recorded."}
              </p>
            </div>

            <div className="mt-4 flex flex-wrap gap-3 text-sm">
              <Link
                href={`/companies/${review.application.job.company.id}`}
                target="_blank"
                className="text-ink/55 hover:text-teal"
              >
                Preview company profile
              </Link>
              <Link
                href={`/seekers/${review.application.seeker.id}`}
                target="_blank"
                className="text-ink/55 hover:text-marigold"
              >
                Preview seeker profile
              </Link>
            </div>

            {activePending ? (
              <div className="mt-4 border-t border-ink/5 pt-4">
                <label htmlFor={`note-${review.id}`} className="mb-2 block text-sm font-medium text-ink">
                  Resolution note (optional, admin-internal)
                </label>
                <textarea
                  id={`note-${review.id}`}
                  rows={3}
                  maxLength={500}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Why you're restoring or hiding this review…"
                  className="w-full resize-y rounded-xl border border-ink/10 px-4 py-3 text-sm outline-none focus:border-navy focus:ring-2 focus:ring-navy/20"
                />
                <p className="mt-1 text-right font-data text-[10px] text-ink/40">{note.length}/500</p>
                {activePending.action === "hide" && (
                  <p className="mt-2 text-xs text-ink/50">
                    This removes the review from both public profiles. The row stays in the database for
                    audit history — nothing is deleted.
                  </p>
                )}
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPending(null);
                      setNote("");
                    }}
                    className="rounded-xl border border-ink/10 px-4 py-2 text-sm font-semibold text-ink/60"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={loadingId === review.id}
                    onClick={() => resolve(review.id, activePending.action)}
                    className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 ${
                      activePending.action === "hide" ? "bg-ember" : "bg-teal"
                    }`}
                  >
                    {activePending.action === "hide" ? (
                      <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
                    ) : (
                      <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    )}
                    Confirm {activePending.action === "hide" ? "hide" : "restore"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-4 flex flex-wrap gap-2 border-t border-ink/5 pt-4">
                <button
                  type="button"
                  disabled={loadingId === review.id}
                  onClick={() => setPending({ reviewId: review.id, action: "restore" })}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-teal px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal/95 disabled:opacity-60"
                >
                  <Check className="h-4 w-4" aria-hidden="true" />
                  Restore
                </button>
                <button
                  type="button"
                  disabled={loadingId === review.id}
                  onClick={() => setPending({ reviewId: review.id, action: "hide" })}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-ember/20 px-4 py-2.5 text-sm font-semibold text-ember hover:bg-ember/5 disabled:opacity-60"
                >
                  <EyeOff className="h-4 w-4" aria-hidden="true" />
                  Hide
                </button>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
