import { NextResponse } from "next/server";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import {
  getSeekerReviewAggregate,
  listPublishedReviewsForSeeker,
  subjectReviewIdsForViewer,
} from "@/lib/reviews";

/**
 * GET /api/public/seekers/[id]/reviews?page=1 — published + disputed
 * reviews only (never PENDING_REVEAL). The list/aggregate themselves are
 * viewer-agnostic and cached (see lib/reviews.ts); `disputableReviewIds` is a
 * separate, uncached, per-viewer add-on so a signed-in visitor who is the
 * subject of one of these rows can see the dispute button. Anonymous
 * requests get the same shape with an empty array.
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const page = Math.max(1, Number(new URL(req.url).searchParams.get("page")) || 1);

    const [reviews, aggregate, session] = await Promise.all([
      listPublishedReviewsForSeeker(id, page),
      getSeekerReviewAggregate(id),
      auth(),
    ]);

    const disputableReviewIds = session?.user
      ? await subjectReviewIdsForViewer(
          session.user.id,
          reviews.map((review) => review.id)
        )
      : [];

    return NextResponse.json({ reviews, aggregate, page, disputableReviewIds });
  } catch (error) {
    return errorResponse(error);
  }
}
