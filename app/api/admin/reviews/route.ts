import { NextResponse } from "next/server";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { requireAdmin } from "@/lib/admin-auth";
import { listDisputedReviews } from "@/lib/reviews";

/**
 * GET /api/admin/reviews?page=1 — the DISPUTED moderation queue. Follows the
 * same auth pattern as app/api/admin/companies/route.ts. Paired with
 * PATCH /api/admin/reviews/[id] (resolveDisputedReview).
 */
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await requireAdmin(session.user.id);

    const page = Math.max(1, Number(new URL(req.url).searchParams.get("page")) || 1);
    const reviews = await listDisputedReviews(page);
    return NextResponse.json({ reviews, page });
  } catch (error) {
    return errorResponse(error);
  }
}
