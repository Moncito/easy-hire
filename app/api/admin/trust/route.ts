import { NextResponse } from "next/server";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { requireAdminWithPermission } from "@/lib/admin-auth";
import { adminTrustDirectoryQuerySchema } from "@/lib/validations/admin";
import { listTrustDirectory, decodeTrustDirectoryCursor, encodeTrustDirectoryCursor } from "@/lib/admin/trust-directory";

/**
 * GET /api/admin/trust?type=SEEKER&cursor=&limit= — the `/admin/trust`
 * directory's data source (docs/ADMIN-CONSOLE-PLAN.md §4.8). Lowest-scoring
 * accounts first, always — see lib/admin/trust-directory.ts's module doc
 * comment for why that ordering is not a caller-supplied option. Gated on
 * `user.read` at BOTH layers, same two-layer discipline as every other
 * route in app/api/admin/*.
 */
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await requireAdminWithPermission(session.user.id, "user.read");

    const url = new URL(req.url);
    const query = adminTrustDirectoryQuerySchema.parse({
      type: url.searchParams.get("type") ?? undefined,
      cursor: url.searchParams.get("cursor") ?? undefined,
      limit: url.searchParams.get("limit") ?? undefined,
    });

    let cursor;
    if (query.cursor) {
      cursor = decodeTrustDirectoryCursor(query.cursor);
      if (!cursor) {
        return NextResponse.json({ error: "Invalid cursor" }, { status: 400 });
      }
    }

    const result = await listTrustDirectory(session.user.id, {
      targetType: query.type,
      cursor: cursor ?? undefined,
      limit: query.limit,
    });

    return NextResponse.json({
      rows: result.rows,
      nextCursor: result.nextCursor ? encodeTrustDirectoryCursor(result.nextCursor) : null,
      scoredCount: result.scoredCount,
      neverScoredCount: result.neverScoredCount,
      belowThresholdCount: result.belowThresholdCount,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
