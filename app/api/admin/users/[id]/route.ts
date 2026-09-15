import { NextResponse } from "next/server";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { requireAdminWithPermission } from "@/lib/admin-auth";
import { adminUserDetailParamsSchema } from "@/lib/validations/admin";
import { getUserRecord } from "@/lib/admin/users";

/**
 * GET /api/admin/users/[id] — the 360-degree record (docs/ADMIN-CONSOLE-PLAN.md
 * §4.3, Phase 2). Thin handler: auth, Zod-validate the [id] segment, call
 * lib/admin/users.ts, respond. `getUserRecord` itself writes the
 * `USER_RECORD_VIEWED` audit row (§8.3: every admin read of another user's
 * PII is audited) — the handler does not duplicate that here.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await requireAdminWithPermission(session.user.id, "user.read");

    const { id } = adminUserDetailParamsSchema.parse(await params);

    const record = await getUserRecord(session.user.id, id);

    return NextResponse.json(record);
  } catch (error) {
    return errorResponse(error);
  }
}
