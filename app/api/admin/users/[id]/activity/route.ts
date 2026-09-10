import { NextResponse } from "next/server";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { requireAdmin } from "@/lib/admin-auth";
import { adminUserDetailParamsSchema, adminUserActivityQuerySchema } from "@/lib/validations/admin";
import { listEventsForUser, decodeEventCursor, encodeEventCursor } from "@/lib/admin/events";

/**
 * GET /api/admin/users/[id]/activity?eventType=&cursor=&limit= — the
 * activity timeline (docs/ADMIN-CONSOLE-PLAN.md §4.3: "every movement,
 * reverse-chronological, filterable by type, infinite scroll"). Thin
 * handler over `listEventsForUser` (lib/admin/events.ts) — cursor-paginated,
 * never OFFSET, per §10.
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await requireAdmin(session.user.id);

    const { id } = adminUserDetailParamsSchema.parse(await params);

    const url = new URL(req.url);
    const query = adminUserActivityQuerySchema.parse({
      eventType: url.searchParams.get("eventType") ?? undefined,
      cursor: url.searchParams.get("cursor") ?? undefined,
      limit: url.searchParams.get("limit") ?? undefined,
    });

    let cursor;
    if (query.cursor) {
      cursor = decodeEventCursor(query.cursor);
      if (!cursor) {
        return NextResponse.json({ error: "Invalid cursor" }, { status: 400 });
      }
    }

    const { events, nextCursor } = await listEventsForUser(id, {
      cursor: cursor ?? undefined,
      limit: query.limit,
      eventType: query.eventType,
    });

    return NextResponse.json({
      events,
      nextCursor: nextCursor ? encodeEventCursor(nextCursor) : null,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
