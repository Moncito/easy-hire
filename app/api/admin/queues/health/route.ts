import { NextResponse } from "next/server";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { requireAdminWithPermission } from "@/lib/admin-auth";
import { getQueueHealth } from "@/lib/admin/queues";

/**
 * GET /api/admin/queues/health — queue depth/SLA-breach counts only, no
 * decision stats. A separate, lighter route from GET /api/admin/queues/stats
 * (which also runs `getDecisionStats`) — that one backs the `/admin/queues`
 * index page's one-time server render; this one backs
 * `components/admin/AdminSidebar.tsx`'s per-navigation/interval badge poll
 * (docs/ADMIN-UI-UPGRADE.md's sidebar notification badges), which has no use
 * for admin-identity decision stats and would otherwise re-run that heavier
 * query on every poll for no reason. Same `queue.decide` gate as every other
 * queues route.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await requireAdminWithPermission(session.user.id, "queue.decide");

    const health = await getQueueHealth();
    return NextResponse.json({ health });
  } catch (error) {
    return errorResponse(error);
  }
}
