import { NextResponse } from "next/server";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { clientKeyFromRequest, enforceRateLimit } from "@/lib/rate-limit";
import { parseJsonBody } from "@/lib/parse-json-body";
import { requireAdminWithPermission } from "@/lib/admin-auth";
import { listFeatureFlags, createFeatureFlag } from "@/lib/admin/feature-flags";

/**
 * GET  /api/admin/feature-flags — list every flag (docs/ADMIN-CONSOLE-PLAN.md
 *      §4.10). Gated on `system.read` at BOTH layers, same convention as
 *      every other route in app/api/admin/*: `requireAdminWithPermission`
 *      here for defence in depth, and `listFeatureFlags` checks the same
 *      permission again itself via `requireAdminPermission` (§8.1's real
 *      gate).
 * POST /api/admin/feature-flags — create a flag. Gated on `system.manage`,
 *      same two-layer discipline, and rate-limited (§8.1: "Rate-limit admin
 *      mutations"), same pattern as app/api/admin/team/route.ts.
 */

const FEATURE_FLAG_MUTATION_RATE_LIMIT = 30;
const FEATURE_FLAG_MUTATION_RATE_WINDOW_SECONDS = 60 * 60;

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await requireAdminWithPermission(session.user.id, "system.read");

    const flags = await listFeatureFlags(session.user.id);

    return NextResponse.json({ flags });
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

    await requireAdminWithPermission(session.user.id, "system.manage");

    await enforceRateLimit({
      key: clientKeyFromRequest(req, "admin:feature-flags:mutate", session.user.id),
      limit: FEATURE_FLAG_MUTATION_RATE_LIMIT,
      windowSeconds: FEATURE_FLAG_MUTATION_RATE_WINDOW_SECONDS,
    });

    const body = await parseJsonBody(req);
    const created = await createFeatureFlag(session.user.id, body);

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
