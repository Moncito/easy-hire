import { NextResponse } from "next/server";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { requireAdmin } from "@/lib/admin-auth";
import { adminJobDirectoryQuerySchema } from "@/lib/validations/admin";
import { listJobDirectory } from "@/lib/admin/jobs";
import { decodeQueueCursor, encodeQueueCursor } from "@/lib/admin/queues";

/**
 * GET /api/admin/jobs/directory?status=&search=&cursor=&limit= — all jobs,
 * any status (docs/ADMIN-CONSOLE-PLAN.md §3: "/admin/jobs — all jobs, any
 * status"). Separate route from GET /api/admin/jobs (the legacy
 * pending-only list still backing the old admin page) and from
 * GET /api/admin/queues?kind=JOB (the risk-ranked moderation subset) — this
 * is the plain, cursor-paginated, all-status browse that lib/admin/jobs.ts's
 * `listJobDirectory` backs. `/admin/jobs` itself still redirects to the
 * queue (Phase 1); this route is the data layer for the future directory
 * page only, per the task's note that the page comes later.
 */
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await requireAdmin(session.user.id);

    const url = new URL(req.url);
    const query = adminJobDirectoryQuerySchema.parse({
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

    const { items, nextCursor } = await listJobDirectory({
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
