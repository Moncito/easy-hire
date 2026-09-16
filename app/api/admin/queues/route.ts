import { NextResponse } from "next/server";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { requireAdminWithPermission } from "@/lib/admin-auth";
import { adminQueueListQuerySchema } from "@/lib/validations/admin";
import { listQueue, decodeQueueCursor, encodeQueueCursor } from "@/lib/admin/queues";

/**
 * GET /api/admin/queues?kind=COMPANY&status=PENDING&search=&cursor=&limit=25&filter=breached
 * — the unified, risk-ranked, cursor-paginated moderation queue (Phase 1,
 * docs/ADMIN-CONSOLE-PLAN.md §4.2). Thin handler: auth, Zod-validate, call
 * lib/admin/queues.ts, respond. Follows the exact auth pattern of the
 * existing app/api/admin/* routes (e.g. app/api/admin/jobs/route.ts).
 *
 * `filter=breached` (optional; the only recognized value today — see
 * `ADMIN_QUEUE_LIST_FILTERS` in lib/validations/admin.ts) restricts the page
 * to SLA-breached items only, via `listQueue`'s `breachedOnly` param. Same
 * query-param name/value as the server-rendered
 * `/admin/queues/[kind]?filter=breached` page, so a client-side "load more"
 * or status-tab switch inside that filtered view keeps agreeing with the
 * first paint instead of silently reverting to the unfiltered queue.
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

    await requireAdminWithPermission(session.user.id, "queue.decide");

    const url = new URL(req.url);
    const query = adminQueueListQuerySchema.parse({
      kind: url.searchParams.get("kind") ?? undefined,
      status: url.searchParams.get("status") ?? undefined,
      search: url.searchParams.get("search") ?? undefined,
      cursor: url.searchParams.get("cursor") ?? undefined,
      limit: url.searchParams.get("limit") ?? undefined,
      filter: url.searchParams.get("filter") ?? undefined,
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
      breachedOnly: query.filter === "breached",
    });

    return NextResponse.json({
      items,
      nextCursor: nextCursor ? encodeQueueCursor(nextCursor) : null,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
