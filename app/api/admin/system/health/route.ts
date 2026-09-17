import { NextResponse } from "next/server";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { requireAdminWithPermission } from "@/lib/admin-auth";
import { getSystemHealth } from "@/lib/admin/system-health";

/**
 * GET /api/admin/system/health — the `/admin/system` health screen's data
 * source (docs/ADMIN-CONSOLE-PLAN.md §4.10). Gated on `system.read` at BOTH
 * layers: `requireAdminWithPermission` here for defence in depth, and
 * `getSystemHealth` checks the same permission again itself via
 * `requireAdminPermission` (§8.1's real gate).
 *
 * Not cached (route handlers are uncached by default for a plain GET, per
 * this Next.js version's docs — see AGENTS.md) — every call recomputes cron
 * health, a live DB round trip, and a handful of row counts. That is the
 * correct default for an internal health screen (staleness here is worse
 * than the extra query cost), not an oversight.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await requireAdminWithPermission(session.user.id, "system.read");

    const health = await getSystemHealth(session.user.id);

    return NextResponse.json(health);
  } catch (error) {
    return errorResponse(error);
  }
}
