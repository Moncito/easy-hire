import { NextResponse } from "next/server";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { listReviewableApplications } from "@/lib/reviews";

/**
 * GET /api/reviews/pending — the signed-in user's own applications eligible
 * for a review by them (either direction), including ones they've already
 * submitted (so the UI can show "submitted, awaiting the other side"). See
 * lib/reviews.ts listReviewableApplications.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const applications = await listReviewableApplications(session.user.id);
    return NextResponse.json({ applications });
  } catch (error) {
    return errorResponse(error);
  }
}
