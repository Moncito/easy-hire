import { NextResponse } from "next/server";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { requireEmployerCompany } from "@/lib/employer-auth";
import { getEmployerAnalytics } from "@/lib/employer-analytics";
import { getAnalyticsRangeForPro } from "@/lib/employer/analytics-rollups";
import { analyticsDateRangeSchema } from "@/lib/validations/analytics";

/**
 * GET /api/employer/analytics — dashboard-style analytics (fixed windows) by
 * default. Pass `from`/`to` (ISO dates) to instead get a rollup-backed range
 * summary for the Reports date-range picker; that path is Employer Pro only.
 */
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "EMPLOYER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const company = await requireEmployerCompany(session.user.id);

    const { searchParams } = new URL(req.url);
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");

    if (fromParam && toParam) {
      const { from, to } = analyticsDateRangeSchema.parse({ from: fromParam, to: toParam });

      const range = await getAnalyticsRangeForPro(company.id, from, to);
      return NextResponse.json(range, { headers: { "Cache-Control": "no-store" } });
    }

    const analytics = await getEmployerAnalytics(company.id);
    return NextResponse.json(analytics, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorResponse(error);
  }
}
