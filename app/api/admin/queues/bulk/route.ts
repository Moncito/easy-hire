import { NextResponse } from "next/server";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { requireAdmin } from "@/lib/admin-auth";
import { adminBulkQueueReviewSchema } from "@/lib/validations/admin";
import { bulkReviewQueueItems } from "@/lib/admin/bulk";

/**
 * POST /api/admin/queues/bulk — bulk approve/reject (COMPANY/JOB/SEEKER) or
 * restore/hide (REVIEW) across the unified moderation queues (Phase 1,
 * docs/ADMIN-CONSOLE-PLAN.md §4.2 "Bulk actions"). Thin handler: auth,
 * Zod-validate, call lib/admin/bulk.ts, respond — same shape as
 * GET /api/admin/queues (app/api/admin/queues/route.ts). Business logic
 * (dedup, dispatch, partial-failure handling) lives entirely in
 * lib/admin/bulk.ts per CLAUDE.md.
 *
 * Always 200 with the per-item breakdown, even when some items failed — a
 * partial success is still a successful batch call, not a 4xx. Only a
 * wholly invalid request body (bad kind/action combination, missing
 * reasonCode on a bulk reject/hide, over the MAX_BULK_QUEUE_IDS cap) is a
 * 4xx, surfaced by Zod via errorResponse.
 */
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await requireAdmin(session.user.id);

    const body = adminBulkQueueReviewSchema.parse(await req.json());

    const result = await bulkReviewQueueItems({
      adminUserId: session.user.id,
      kind: body.kind,
      ids: body.ids,
      action: body.action,
      reason: body.reason,
      note: body.note,
      reasonCode: body.reasonCode,
    });

    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}
