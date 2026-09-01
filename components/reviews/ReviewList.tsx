import Link from "next/link";
import StarRating from "@/components/reviews/StarRating";
import DisputeReviewButton from "@/components/reviews/DisputeReviewButton";
import type { listPublishedReviewsForCompany } from "@/lib/reviews";

/** Row shape as returned by listPublishedReviewsForCompany/listPublishedReviewsForSeeker — both use the same PUBLIC_REVIEW_SELECT in lib/reviews.ts. */
export type PublicReviewRow = Awaited<ReturnType<typeof listPublishedReviewsForCompany>>[number];

type Props = {
  reviews: PublicReviewRow[];
  /** Review ids the current viewer is the subject of and may still dispute — from subjectReviewIdsForViewer. Empty/omitted for guests or non-subjects. */
  disputableReviewIds?: string[];
  page?: number;
  totalPages?: number;
  /** Page path (no query string) used to build the `?reviewsPage=` prev/next links, e.g. `/companies/abc123`. Pagination controls are omitted without it. */
  baseHref?: string;
};

function formatRevealedDate(date: Date | string | null): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
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

export default function ReviewList({
  reviews,
  disputableReviewIds = [],
  page = 1,
  totalPages = 1,
  baseHref,
}: Props) {
  if (reviews.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[#E4E2DC] p-8 text-center">
        <p className="text-sm font-semibold text-ink/60">No reviews yet</p>
        <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-ink/40">
          Reviews on EasyHire only unlock once an application reaches a completed hire — there&apos;s
          nothing here to buy or fake.
        </p>
      </div>
    );
  }

  const disputable = new Set(disputableReviewIds);

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-4">
        {reviews.map((review) => {
          const isSeekerAuthor = review.direction === "SEEKER_TO_COMPANY";
          const author = isSeekerAuthor
            ? {
                name: review.application.seeker.fullName,
                sub: review.application.seeker.headline,
                photoUrl: review.application.seeker.photoUrl,
              }
            : {
                name: review.application.job.company.companyName,
                sub: review.application.job.title ? `Hired for ${review.application.job.title}` : null,
                photoUrl: review.application.job.company.logoUrl,
              };
          const accent = isSeekerAuthor ? "marigold" : "teal";
          const isDisputed = review.status === "DISPUTED";

          return (
            <li
              key={review.id}
              className="rounded-xl border border-[#E4E2DC] bg-white p-5 shadow-[0_1px_2px_rgba(17,17,16,0.04)] sm:p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  {author.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={author.photoUrl}
                      alt=""
                      className="h-10 w-10 shrink-0 rounded-full border border-[#E4E2DC] object-cover"
                    />
                  ) : (
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                        isSeekerAuthor ? "bg-marigold/15 text-[#9A5B12]" : "bg-teal/10 text-teal"
                      }`}
                      aria-hidden="true"
                    >
                      {initialsFrom(author.name)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-ink">{author.name}</p>
                    {author.sub && <p className="truncate text-xs text-ink/45">{author.sub}</p>}
                  </div>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-1">
                  <StarRating value={review.rating} size="sm" accent={accent} />
                  <p className="font-data text-[11px] text-ink/35">{formatRevealedDate(review.revealedAt)}</p>
                </div>
              </div>

              {isDisputed && (
                <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-ember/20 bg-ember/[0.06] px-2.5 py-1 text-[11px] font-semibold text-ember/80">
                  Under review
                </span>
              )}

              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-ink/75">{review.body}</p>

              {disputable.has(review.id) && (
                <div className="mt-4">
                  <DisputeReviewButton reviewId={review.id} />
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {baseHref && totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-[#E4E2DC] pt-4 text-sm">
          {page > 1 ? (
            <Link
              href={`${baseHref}?reviewsPage=${page - 1}#reviews`}
              className="font-semibold text-ink/60 hover:text-ink"
            >
              ← Newer reviews
            </Link>
          ) : (
            <span aria-hidden="true" />
          )}
          <span className="font-data text-xs text-ink/40">
            Page {page} of {totalPages}
          </span>
          {page < totalPages ? (
            <Link
              href={`${baseHref}?reviewsPage=${page + 1}#reviews`}
              className="font-semibold text-ink/60 hover:text-ink"
            >
              Older reviews →
            </Link>
          ) : (
            <span aria-hidden="true" />
          )}
        </div>
      )}
    </div>
  );
}
