import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/api-error";
import { getCompanyReviewAggregate, listPublishedReviewsForCompany } from "@/lib/reviews";

/** GET /api/public/companies/[id]/reviews?page=1 — published + disputed reviews only (never PENDING_REVEAL). */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const page = Math.max(1, Number(new URL(req.url).searchParams.get("page")) || 1);

    const [reviews, aggregate] = await Promise.all([
      listPublishedReviewsForCompany(id, page),
      getCompanyReviewAggregate(id),
    ]);

    return NextResponse.json({ reviews, aggregate, page });
  } catch (error) {
    return errorResponse(error);
  }
}
