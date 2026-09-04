"use client";

import { useId, useState } from "react";
import type { FormEvent } from "react";
import type { ReviewStatus } from "@prisma/client";
import RatingInput, { type RatingInputAccent } from "@/components/reviews/RatingInput";
import { reviewSubmitSchema } from "@/lib/validations/review";

const MIN_LENGTH = 40;
const MAX_LENGTH = 2000;

/** Minimal shape of the review row POST /api/reviews returns (see lib/reviews.ts submitReview) — enough to update the prompt list optimistically. */
export type SubmittedReview = {
  id: string;
  rating: number;
  status: ReviewStatus;
  submittedAt: string;
  revealedAt: string | null;
};

type Props = {
  applicationId: string;
  accent: RatingInputAccent;
  onSubmitted: (review: SubmittedReview) => void;
  onCancel: () => void;
};

export default function SubmitReviewForm({ applicationId, accent, onSubmitted, onCancel }: Props) {
  const [rating, setRating] = useState<number | null>(null);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ratingInvalid, setRatingInvalid] = useState(false);

  const bodyId = useId();
  const errorId = useId();

  const trimmedLength = body.trim().length;
  const belowMin = trimmedLength > 0 && trimmedLength < MIN_LENGTH;
  const bodyInvalid = Boolean(error) && !ratingInvalid;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setRatingInvalid(false);

    const parsed = reviewSubmitSchema.safeParse({
      applicationId,
      rating: rating ?? 0,
      body,
    });
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      setRatingInvalid(issue?.path[0] === "rating");
      setError(issue?.message ?? "Please check your review before submitting.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError((data as { error?: string } | null)?.error ?? "Couldn't submit your review. Please try again.");
        setLoading(false);
        return;
      }

      setLoading(false);
      onSubmitted(data as SubmittedReview);
    } catch {
      setError("Couldn't submit your review. Please check your connection and try again.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="mt-4 flex flex-col gap-4 rounded-xl bg-ink/[0.02] p-4 ring-1 ring-ink/8">
      <RatingInput
        value={rating}
        onChange={(next) => {
          setRating(next);
          setRatingInvalid(false);
        }}
        accent={accent}
        disabled={loading}
        invalid={ratingInvalid}
        describedBy={ratingInvalid ? errorId : undefined}
      />

      <div>
        <label htmlFor={bodyId} className="block text-xs font-semibold uppercase tracking-wider text-ink/45">
          Your review
        </label>
        <textarea
          id={bodyId}
          value={body}
          onChange={(e) => setBody(e.target.value.slice(0, MAX_LENGTH))}
          rows={5}
          required
          disabled={loading}
          aria-invalid={bodyInvalid ? true : undefined}
          aria-describedby={bodyInvalid ? errorId : undefined}
          placeholder="Share specifics about the working relationship — communication, reliability, what stood out (40 characters minimum)…"
          className={`mt-2 w-full rounded-xl border p-3 text-sm text-ink outline-none focus:ring-1 disabled:opacity-60 ${
            bodyInvalid
              ? "border-ember/50 focus:border-ember focus:ring-ember/20"
              : "border-ink/10 focus:border-navy focus:ring-navy/15"
          }`}
        />
        <div className="mt-1 flex items-center justify-between text-[11px]">
          <span className={belowMin ? "font-medium text-ember/80" : "text-ink/35"}>
            {belowMin ? `${MIN_LENGTH - trimmedLength} more characters needed` : "40 character minimum"}
          </span>
          <span className="font-data text-ink/40">
            {body.length}/{MAX_LENGTH}
          </span>
        </div>
      </div>

      <div className="rounded-lg bg-navy/5 px-3.5 py-3 text-xs leading-relaxed text-ink/60">
        <strong className="text-ink/80">This review is sealed until both sides submit.</strong> You
        won&apos;t see the other party&apos;s review right after submitting — yours stays hidden from them,
        and theirs from you, until they submit theirs too or the 14-day review window closes. Then both
        publish at the same moment. It&apos;s a deliberate double-blind design so neither side can review
        the other in retaliation — the delay isn&apos;t a bug.
      </div>

      {error && (
        <p id={errorId} role="alert" className="text-sm text-ember">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="rounded-xl border border-ink/10 px-4 py-2.5 text-sm font-semibold text-ink/70 hover:bg-ink/3 disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          aria-busy={loading}
          className={`rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-60 ${
            accent === "marigold" ? "bg-marigold text-ink hover:bg-marigold/90" : "bg-teal text-white hover:bg-teal/90"
          }`}
        >
          {loading ? "Submitting…" : "Submit review"}
        </button>
      </div>
    </form>
  );
}
