import { NextResponse } from "next/server";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { parseJsonBody } from "@/lib/parse-json-body";
import { requireAdmin } from "@/lib/admin-auth";
import { adminUserDetailParamsSchema } from "@/lib/validations/admin";
import { performUserSupportAction } from "@/lib/admin/users";

/**
 * POST /api/admin/users/[id]/actions — support actions (docs/ADMIN-CONSOLE-PLAN.md
 * §4.3): password reset, resend verification, delete. Suspend/restore and
 * impersonate are deliberately not here — see lib/admin/users.ts's module
 * doc comment for why (no status column yet; impersonation is Phase 5).
 * Thin handler: auth, parse the body, call lib/admin/users.ts, respond.
 * Zod-validation of the body itself happens inside `performUserSupportAction`
 * (adminUserActionSchema), same as reviewCompany/reviewJob/
 * reviewSeekerVerification parsing their own body in lib/admin/{companies,jobs,seekers}.ts.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await requireAdmin(session.user.id);

    const { id } = adminUserDetailParamsSchema.parse(await params);
    const body = await parseJsonBody(req);

    const result = await performUserSupportAction(session.user.id, id, body);

    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}
