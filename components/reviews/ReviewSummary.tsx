import StarRating from "@/components/reviews/StarRating";
import type { ReviewAggregate } from "@/lib/reviews";

type Props = {
  aggregate: ReviewAggregate;
  /** Which side is being reviewed — drives empty-state copy and the star accent (author's side). */
  subjectType: "company" | "seeker";
};

/** Aggregate header: average rating + review count. Renders the empty-state framing instead of "0.0 stars" when there's nothing to show yet. */
export default function ReviewSummary({ aggregate, subjectType }: Props) {
  const { average, count } = aggregate;
  const authorNoun = subjectType === "company" ? "virtual assistants they've hired" : "employers who've hired them";

  if (count === 0 || average === null) {
    return (
      <div className="flex flex-col gap-1">
        <p className="font-display text-base font-bold text-ink">No reviews yet</p>
        <p className="text-sm text-ink/45">
          Reviews unlock only after a completed hire — none of {authorNoun} have submitted one yet.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <StarRating value={average} count={count} size="lg" accent={subjectType === "company" ? "marigold" : "teal"} />
      <p className="text-sm text-ink/45">
        Reviews only unlock once a hire is confirmed on both sides — nothing here can be bought or faked.
      </p>
    </div>
  );
}
