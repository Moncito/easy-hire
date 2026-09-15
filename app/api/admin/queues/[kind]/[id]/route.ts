import { NextResponse } from "next/server";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { requireAdminWithPermission } from "@/lib/admin-auth";
import { adminQueueDetailParamsSchema } from "@/lib/validations/admin";
import { getQueueItemDetail } from "@/lib/admin/queue-detail";

/**
 * GET /api/admin/queues/[kind]/[id] — per-item detail for the side-by-side
 * review pane (docs/ADMIN-CONSOLE-PLAN.md §4.2: "Document viewer left,
 * decision form right, no navigation between them"). `listQueue`
 * (lib/admin/queues.ts) deliberately returns no documents in its list
 * payloads — this is the read that fills that gap for exactly one item.
 * Thin handler: auth, Zod-validate the [kind]/[id] segments, call
 * lib/admin/queue-detail.ts, respond. Same shape as GET /api/admin/queues
 * (app/api/admin/queues/route.ts).
 *
 * The `kind` segment uses the SAME uppercase vocabulary as
 * ADMIN_QUEUE_KINDS ("COMPANY" | "SEEKER" | "JOB" | "REVIEW") — one
 * vocabulary across every admin queue endpoint, never a lowercase/plural
 * alias. An unrecognized kind fails Zod parsing and comes back as a 400 via
 * errorResponse, not a runtime crash.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ kind: string; id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await requireAdminWithPermission(session.user.id, "document.view");

    const { kind, id } = adminQueueDetailParamsSchema.parse(await params);

    const detail = await getQueueItemDetail({ adminUserId: session.user.id, kind, id });

    return NextResponse.json(detail);
  } catch (error) {
    return errorResponse(error);
  }
}
