import { NextResponse } from "next/server";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { requireAdminWithPermission } from "@/lib/admin-auth";
import { adminAuditLogQuerySchema } from "@/lib/validations/admin";
import { listAuditLogForAdmin, decodeAuditCursor, encodeAuditCursor } from "@/lib/admin/audit";

/**
 * GET /api/admin/audit?adminUserId=&targetType=&targetId=&action=&since=&until=&cursor=&limit=
 * — the `/admin/audit` browse screen's data source (docs/ADMIN-CONSOLE-PLAN.md
 * §4.9). Gated on `audit.read` at BOTH layers: `requireAdminWithPermission`
 * here for defence in depth, and `listAuditLogForAdmin` checks the same
 * permission again itself via `requireAdminPermission` (§8.1's real gate) —
 * and is also the only place `action` gets validated against the real
 * `ADMIN_AUDIT_ACTIONS` vocabulary (see that function's own doc comment for
 * why that check does not live in the Zod schema).
 */
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await requireAdminWithPermission(session.user.id, "audit.read");

    const url = new URL(req.url);
    const query = adminAuditLogQuerySchema.parse({
      adminUserId: url.searchParams.get("adminUserId") ?? undefined,
      targetType: url.searchParams.get("targetType") ?? undefined,
      targetId: url.searchParams.get("targetId") ?? undefined,
      action: url.searchParams.get("action") ?? undefined,
      since: url.searchParams.get("since") ?? undefined,
      until: url.searchParams.get("until") ?? undefined,
      cursor: url.searchParams.get("cursor") ?? undefined,
      limit: url.searchParams.get("limit") ?? undefined,
    });

    let cursor;
    if (query.cursor) {
      cursor = decodeAuditCursor(query.cursor);
      if (!cursor) {
        return NextResponse.json({ error: "Invalid cursor" }, { status: 400 });
      }
    }

    const { logs, nextCursor } = await listAuditLogForAdmin(session.user.id, {
      adminUserId: query.adminUserId,
      targetType: query.targetType,
      targetId: query.targetId,
      action: query.action,
      since: query.since,
      until: query.until,
      cursor: cursor ?? undefined,
      limit: query.limit,
    });

    return NextResponse.json({
      logs,
      nextCursor: nextCursor ? encodeAuditCursor(nextCursor) : null,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
