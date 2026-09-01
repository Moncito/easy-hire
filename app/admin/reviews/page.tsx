import { auth } from "@/Auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { listDisputedReviews, REVIEWS_PAGE_SIZE } from "@/lib/reviews";
import ReviewDisputeQueue from "@/components/admin/ReviewDisputeQueue";

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const reviews = await listDisputedReviews(page);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold tracking-tight text-ink">Review disputes</h1>
        <p className="mt-2 text-sm text-ink/55">
          Resolve reviews the subject has flagged as inaccurate or unfair — restore what should stay public,
          hide what shouldn&apos;t.
        </p>
      </div>

      <ReviewDisputeQueue initialReviews={JSON.parse(JSON.stringify(reviews))} />

      {(page > 1 || reviews.length === REVIEWS_PAGE_SIZE) && (
        <div className="mt-6 flex items-center justify-between text-sm">
          {page > 1 ? (
            <Link href={`/admin/reviews?page=${page - 1}`} className="font-semibold text-teal hover:underline">
              ← Previous
            </Link>
          ) : (
            <span aria-hidden="true" />
          )}
          {reviews.length === REVIEWS_PAGE_SIZE ? (
            <Link href={`/admin/reviews?page=${page + 1}`} className="font-semibold text-teal hover:underline">
              Next →
            </Link>
          ) : (
            <span aria-hidden="true" />
          )}
        </div>
      )}
    </div>
  );
}
