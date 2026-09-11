import { NextResponse } from "next/server";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { clientKeyFromRequest, enforceRateLimit } from "@/lib/rate-limit";
import { parseJsonBody } from "@/lib/parse-json-body";
import { requireAdminWithPermission } from "@/lib/admin-auth";
import { listAdminTeam, createOrAssignAdminProfile } from "@/lib/admin/permissions";

/**
 * GET  /api/admin/team — list every `Role.ADMIN` user with their resolved
 *      `AdminProfile` (level/permissions), including admins who don't have a
 *      profile row yet (docs/ADMIN-CONSOLE-PLAN.md §6.7/§8.1). Gated on
 *      `team.manage` (SUPER_ADMIN only) at BOTH layers, same convention as
 *      every other route in app/api/admin/*: `requireAdminWithPermission`
 *      here for defence in depth, and `listAdminTeam`/
 *      `createOrAssignAdminProfile` check the same permission again
 *      themselves via `requireAdminPermission` (§8.1's real gate).
 * POST /api/admin/team — assign an `AdminProfile` to an existing
 *      `Role.ADMIN` user. Rate-limited, same pattern as
 *      app/api/account/delete/route.ts's `enforceRateLimit` use.
 */

const TEAM_MUTATION_RATE_LIMIT = 30;
const TEAM_MUTATION_RATE_WINDOW_SECONDS = 60 * 60;

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await requireAdminWithPermission(session.user.id, "team.manage");

    const result = await listAdminTeam(session.user.id);

    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await requireAdminWithPermission(session.user.id, "team.manage");

    await enforceRateLimit({
      key: clientKeyFromRequest(req, "admin:team:mutate", session.user.id),
      limit: TEAM_MUTATION_RATE_LIMIT,
      windowSeconds: TEAM_MUTATION_RATE_WINDOW_SECONDS,
    });

    const body = await parseJsonBody(req);
    const created = await createOrAssignAdminProfile(session.user.id, body);

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
