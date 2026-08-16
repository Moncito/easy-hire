import { NextResponse } from "next/server";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { requireProCompanyForAi } from "@/lib/ai/gates";
import { getAiUsageSummary, listRecentAiUsage } from "@/lib/ai/usage";
import { AI_RATE_LIMIT_PER_HOUR } from "@/lib/ai/rate-limit";

/**
 * GET /api/employer/ai/usage — Employer Pro only. Powers the Easy AI usage
 * panel: a per-feature 30-day summary, the most recent generations, and the
 * per-feature hourly rate limit so the UI can explain throttling.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "EMPLOYER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const company = await requireProCompanyForAi(session.user.id);

    const [summary, recent] = await Promise.all([
      getAiUsageSummary(company.id),
      listRecentAiUsage(company.id),
    ]);

    return NextResponse.json(
      { summary, recent, limit: AI_RATE_LIMIT_PER_HOUR },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    return errorResponse(error);
  }
}
