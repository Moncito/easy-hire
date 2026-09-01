import { NextResponse } from "next/server";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { clientKeyFromRequest, enforceRateLimit } from "@/lib/rate-limit";
import { parseJsonBody } from "@/lib/parse-json-body";
import { disputeReview } from "@/lib/reviews";

const DISPUTE_RATE_LIMIT = 10;
const DISPUTE_RATE_WINDOW_SECONDS = 60 * 60;

/**
 * POST /api/reviews/[id]/dispute — flag a PUBLISHED review for admin review.
 * Only the review's subject (the reviewed company's active member, or the
 * reviewed seeker) may dispute it. See lib/reviews.ts disputeReview.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await enforceRateLimit({
      key: clientKeyFromRequest(req, "reviews:dispute", session.user.id),
      limit: DISPUTE_RATE_LIMIT,
      windowSeconds: DISPUTE_RATE_WINDOW_SECONDS,
    });

    const { id } = await params;
    const body = await parseJsonBody(req);
    const review = await disputeReview(session.user.id, id, body);
    return NextResponse.json(review);
  } catch (error) {
    return errorResponse(error);
  }
}
