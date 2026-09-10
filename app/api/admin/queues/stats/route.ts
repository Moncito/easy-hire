import { NextResponse } from "next/server";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { requireAdmin } from "@/lib/admin-auth";
import { adminQueueStatsQuerySchema } from "@/lib/validations/admin";
import { getQueueHealth, getDecisionStats } from "@/lib/admin/queues";

/**
 * GET /api/admin/queues/stats?since=2026-09-01T00:00:00Z — queue health
 * (depth, oldest-item age, SLA breach count, per queue) plus decision stats
 * (by admin, by action, overturn rate) since `since` (defaults to the last
 * 7 days). Thin handler, same auth pattern as
 * app/api/admin/queues/route.ts.
 */
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await requireAdmin(session.user.id);

    const url = new URL(req.url);
    const query = adminQueueStatsQuerySchema.parse({
      since: url.searchParams.get("since") ?? undefined,
    });
    const [health, decisions] = await Promise.all([getQueueHealth(), getDecisionStats({ since: query.since })]);

    return NextResponse.json({ health, decisions });
  } catch (error) {
    return errorResponse(error);
  }
}
