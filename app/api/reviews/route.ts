import { NextResponse } from "next/server";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { clientKeyFromRequest, enforceRateLimit } from "@/lib/rate-limit";
import { parseJsonBody } from "@/lib/parse-json-body";
import { submitReview } from "@/lib/reviews";

// Authenticated, but a spam surface — cap per-user review submissions.
const SUBMIT_RATE_LIMIT = 20;
const SUBMIT_RATE_WINDOW_SECONDS = 60 * 60;

/**
 * POST /api/reviews — submit a review for a HIRED application (seeker or
 * employer side; direction is derived server-side, never accepted from the
 * client). See lib/reviews.ts submitReview for eligibility, the double-blind
 * reveal, and the simultaneous-submission race handling.
 */
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await enforceRateLimit({
      key: clientKeyFromRequest(req, "reviews:submit", session.user.id),
      limit: SUBMIT_RATE_LIMIT,
      windowSeconds: SUBMIT_RATE_WINDOW_SECONDS,
    });

    const body = await parseJsonBody(req);
    const review = await submitReview(session.user.id, body);
    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
