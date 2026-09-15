import { NextResponse } from "next/server";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { clientKeyFromRequest, enforceRateLimit } from "@/lib/rate-limit";
import { parseJsonBody } from "@/lib/parse-json-body";
import { requireAdminWithPermission } from "@/lib/admin-auth";
import { adminTeamDetailParamsSchema } from "@/lib/validations/admin";
import { updateAdminProfile, revokeAdminProfile } from "@/lib/admin/permissions";

/**
 * PATCH  /api/admin/team/[id] — change an existing admin's level and/or
 *        permissions. `[id]` is the TARGET USER's id (see
 *        adminTeamDetailParamsSchema's doc comment in lib/validations/admin.ts).
 * DELETE /api/admin/team/[id] — revoke an admin's profile.
 *
 * Both are gated on `team.manage` (SUPER_ADMIN only) inside
 * lib/admin/permissions.ts's updateAdminProfile/revokeAdminProfile — the
 * real gate, per §8.1 — and both refuse self-targeting and a last-remaining
 * SUPER_ADMIN change (see that module's doc comments for exactly how).
 * Rate-limited the same way as POST /api/admin/team.
 */

const TEAM_MUTATION_RATE_LIMIT = 30;
const TEAM_MUTATION_RATE_WINDOW_SECONDS = 60 * 60;

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
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

    const { id } = adminTeamDetailParamsSchema.parse(await params);
    const body = await parseJsonBody(req);

    const updated = await updateAdminProfile(session.user.id, id, body);

    return NextResponse.json(updated);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
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

    const { id } = adminTeamDetailParamsSchema.parse(await params);

    const result = await revokeAdminProfile(session.user.id, id);

    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}
