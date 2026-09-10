import { NextResponse } from "next/server";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { requireAdmin } from "@/lib/admin-auth";
import { adminQueueListQuerySchema } from "@/lib/validations/admin";
import { listQueue, decodeQueueCursor, encodeQueueCursor } from "@/lib/admin/queues";

/**
 * GET /api/admin/queues?kind=COMPANY&status=PENDING&search=&cursor=&limit=25
 * — the unified, risk-ranked, cursor-paginated moderation queue (Phase 1,
 * docs/ADMIN-CONSOLE-PLAN.md §4.2). Thin handler: auth, Zod-validate, call
 * lib/admin/queues.ts, respond. Follows the exact auth pattern of the
 * existing app/api/admin/* routes (e.g. app/api/admin/jobs/route.ts).
 *
 * Does NOT replace GET /api/admin/{companies,jobs,seekers/verifications}
 * or GET /api/admin/reviews — those keep serving the current admin pages
 * unchanged.
 */
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await requireAdmin(session.user.id);

    const url = new URL(req.url);
    const query = adminQueueListQuerySchema.parse({
      kind: url.searchParams.get("kind") ?? undefined,
      status: url.searchParams.get("status") ?? undefined,
      search: url.searchParams.get("search") ?? undefined,
      cursor: url.searchParams.get("cursor") ?? undefined,
      limit: url.searchParams.get("limit") ?? undefined,
    });

    let cursor;
    if (query.cursor) {
      cursor = decodeQueueCursor(query.cursor);
      if (!cursor) {
        return NextResponse.json({ error: "Invalid cursor" }, { status: 400 });
      }
    }

    const { items, nextCursor } = await listQueue({
      kind: query.kind,
      status: query.status,
      search: query.search,
      cursor: cursor ?? undefined,
      limit: query.limit,
    });

    return NextResponse.json({
      items,
      nextCursor: nextCursor ? encodeQueueCursor(nextCursor) : null,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
