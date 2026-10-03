"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Star, X } from "lucide-react";
import StarRating from "@/components/reviews/StarRating";
import SubmitReviewForm, { type SubmittedReview } from "@/components/reviews/SubmitReviewForm";
import type { ReviewableApplicationEntry, MyReviewSummary } from "@/lib/reviews";

/**
 * Only the fields this list actually renders (rating + status) — deliberately
 * narrower than MyReviewSummary so the optimistic override doesn't have to
 * fabricate Date values for submittedAt/revealedAt out of the API response's
 * JSON strings.
 */
type MyReviewOverride = Pick<MyReviewSummary, "id" | "rating" | "status">;

type Props = {
  entries: ReviewableApplicationEntry[];
  /**
   * Wall-clock read taken once by the host Server Component (same pattern as
   * `nowMs` on the seeker dashboard) — this component never calls
   * `Date.now()`/`new Date()` itself during render, so re-renders stay pure.
   */
  nowMs: number;
  /**
   * One-line summary with a "Review" button that expands the full list in place,
   * and an X that hides it until the page reloads. Default false: the full card.
   */
  compact?: boolean;
};

function toDate(value: Date | string): Date {
  return typeof value === "string" ? new Date(value) : value;
}

function daysLeft(nowMs: number, expiresAt: Date | string): number {
  return Math.ceil((toDate(expiresAt).getTime() - nowMs) / (24 * 60 * 60 * 1000));
}

function initialsFrom(name: string): string {
  return (
    name
      .split(" ")
      .map((w) => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?"
  );
}

/**
 * Post-hire review task list — mounted on the seeker dashboard and the
 * employer applicants view. Renders every entry `listReviewableApplications`
 * returns, in three states driven by `myReview` alone (never by the window,
 * per lib/reviews.ts shapeReviewableApplication — a null `myReview` here is
 * already guaranteed to be inside the window):
 *  - null            → "Write a review" opens SubmitReviewForm inline.
 *  - PENDING_REVEAL  → submitted, sealed. Shows the reviewer's own rating
 *    back to them only — never a hint of whether the other side has acted.
 *  - anything else   → revealed; shows the rating and a link to where it's
 *    publicly visible.
 */
export default function ReviewablePromptList({ entries, nowMs, compact = false }: Props) {
  const router = useRouter();
  const [openId, setOpenId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  // Local overrides so a just-submitted review shows as sealed immediately,
  // without needing an effect to resync `entries` from refreshed props.
  const [overrides, setOverrides] = useState<Record<string, MyReviewOverride>>({});

  if (entries.length === 0) return null;

  const pendingEntries = entries.filter((entry) => (overrides[entry.applicationId] ?? entry.myReview) === null);
  const pendingCount = pendingEntries.length;

  if (compact && dismissed) return null;

  if (compact && !expanded) {
    const listed = pendingCount > 0 ? pendingEntries : entries;
    const names = listed.map((entry) => entry.counterpart.name.trim().split(/\s+/)[0] || entry.counterpart.name);
    const nameLabel =
      names.length > 2 ? `${names.slice(0, 2).join(", ")} +${names.length - 2}` : names.join(", ");
    const summary =
      pendingCount > 0 ? `${pendingCount} review${pendingCount === 1 ? "" : "s"} to write` : "Post-hire reviews";

    // A chip that hugs its content, not a full-width card: it is a reminder,
    // and should not compete with the job header below it.
    return (
      <section
        aria-label="Post-hire reviews"
        className="inline-flex max-w-full items-center gap-1 rounded-full bg-teal/8 py-1 pl-3 pr-1 text-sm ring-1 ring-teal/15"
      >
        <Star className="h-3.5 w-3.5 shrink-0 text-teal" aria-hidden="true" />
        <p className="min-w-0 truncate pl-1 text-ink/70">
          <span className="font-semibold text-ink">{summary}</span>
          {nameLabel ? <span> · {nameLabel}</span> : null}
        </p>
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="ml-1 inline-flex shrink-0 items-center gap-0.5 rounded-full px-2.5 py-0.5 text-xs font-semibold text-teal transition hover:bg-teal/10"
        >
          {pendingCount > 0 ? "Review" : "View"}
          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Hide review reminder"
          className="shrink-0 rounded-full p-1 text-ink/35 transition hover:bg-ink/5 hover:text-ink"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="reviewable-heading"
      className="rounded-2xl bg-white p-5 ring-1 ring-ink/8 sm:p-6"
    >
      {compact ? (
        <div className="mb-2 flex justify-end">
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="rounded-lg px-2.5 py-1 text-xs font-semibold text-ink/55 transition hover:bg-ink/5 hover:text-ink"
          >
            Collapse
          </button>
        </div>
      ) : null}
      <h2 id="reviewable-heading" className="font-display text-base font-bold text-ink">
        {pendingCount > 0
          ? `${pendingCount} review${pendingCount === 1 ? "" : "s"} to write`
          : "Post-hire reviews"}
      </h2>
      <p className="mb-4 mt-1 text-sm text-ink/50">
        {pendingCount > 0
          ? "Reviews are double-blind — write yours honestly, it stays sealed until the other side submits too."
          : "Your reviews from recent hires."}
      </p>

      <ul className="flex flex-col divide-y divide-ink/6">
        {entries.map((entry) => {
          const myReview = overrides[entry.applicationId] ?? entry.myReview;
          const accent = entry.role === "SEEKER" ? "marigold" : "teal";
          const counterpart = entry.counterpart;
          const name = counterpart.name;
          const sub = counterpart.type === "COMPANY" ? `Hired for ${entry.jobTitle}` : counterpart.headline;
          const photoUrl = counterpart.type === "COMPANY" ? counterpart.logoUrl : counterpart.photoUrl;
          // /seekers/[id] only serves PUBLIC profiles, so a Standard/Private
          // seeker has no public page to send the reviewer to.
          const publicHref =
            counterpart.type === "COMPANY"
              ? `/companies/${counterpart.id}`
              : counterpart.hasPublicProfile
                ? `/seekers/${counterpart.id}`
                : null;
          const isOpen = openId === entry.applicationId;
          const remaining = daysLeft(nowMs, entry.windowExpiresAt);

          return (
            <li key={entry.applicationId} className="py-4 first:pt-0 last:pb-0">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  {photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={photoUrl}
                      alt=""
                      className="h-10 w-10 shrink-0 rounded-full border border-ink/10 object-cover"
                    />
                  ) : (
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                        accent === "marigold" ? "bg-marigold/15 text-[#9A5B12]" : "bg-teal/10 text-teal"
                      }`}
                      aria-hidden="true"
                    >
                      {initialsFrom(name)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-ink">{name}</p>
                    {sub && <p className="truncate text-xs text-ink/45">{sub}</p>}
                  </div>
                </div>

                {myReview === null ? (
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="font-data text-[11px] text-ink/40">
                      {remaining <= 0 ? "Closes today" : remaining === 1 ? "1 day left" : `${remaining} days left`}
                    </span>
                    <button
                      type="button"
                      onClick={() => setOpenId(isOpen ? null : entry.applicationId)}
                      aria-expanded={isOpen}
                      className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                        accent === "marigold"
                          ? "bg-marigold text-ink hover:bg-marigold/90"
                          : "bg-teal text-white hover:bg-teal/90"
                      }`}
                    >
                      {isOpen ? "Cancel" : "Write a review"}
                    </button>
                  </div>
                ) : myReview.status === "PENDING_REVEAL" ? (
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <StarRating value={myReview.rating} size="sm" accent={accent} />
                    <span className="text-[11px] font-medium text-ink/40">
                      Sealed — {remaining <= 0 ? "reveals any time now" : `auto-reveals in ${remaining}d if not sooner`}
                    </span>
                  </div>
                ) : myReview.status === "HIDDEN" ? (
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <StarRating value={myReview.rating} size="sm" accent={accent} />
                    <span className="max-w-[14rem] text-right text-[11px] font-medium text-ink/40">
                      Removed after a dispute — no longer shown publicly
                    </span>
                  </div>
                ) : (
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <StarRating value={myReview.rating} size="sm" accent={accent} />
                    {publicHref ? (
                      <Link
                        href={`${publicHref}#reviews`}
                        className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-navy hover:underline"
                      >
                        View published
                        <ChevronRight className="h-3 w-3" aria-hidden="true" />
                      </Link>
                    ) : (
                      <span className="text-[11px] font-medium text-ink/40">Published</span>
                    )}
                    {myReview.status === "DISPUTED" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-ink/5 px-2 py-0.5 text-[10px] font-semibold text-ink/45">
                        Under review
                      </span>
                    )}
                  </div>
                )}
              </div>

              {myReview === null && isOpen && (
                <SubmitReviewForm
                  applicationId={entry.applicationId}
                  accent={accent}
                  onCancel={() => setOpenId(null)}
                  onSubmitted={(review: SubmittedReview) => {
                    setOverrides((prev) => ({
                      ...prev,
                      [entry.applicationId]: {
                        id: review.id,
                        rating: review.rating,
                        status: review.status,
                      },
                    }));
                    setOpenId(null);
                    router.refresh();
                  }}
                />
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
