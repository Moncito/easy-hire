import { redirect } from "next/navigation";

/**
 * Legacy path — see the note in app/admin/jobs/page.tsx. The review dispute
 * queue now lives at /admin/queues/reviews.
 *
 * The old `?page=` query parameter is deliberately dropped rather than
 * translated: the new queue is cursor-paginated (lib/admin/queues.ts), so an
 * offset page number has no equivalent to map onto, and inventing one would
 * land the operator somewhere arbitrary. Landing on page one of a
 * risk-ranked queue is the correct behaviour anyway — the top of that list
 * is what needs attention.
 */
export default function AdminReviewsPage() {
  redirect("/admin/queues/reviews");
}
