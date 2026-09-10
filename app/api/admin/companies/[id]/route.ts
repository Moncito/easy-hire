import { NextResponse } from "next/server";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { parseJsonBody } from "@/lib/parse-json-body";
import { requireAdmin } from "@/lib/admin-auth";
import { adminCompanyDetailParamsSchema } from "@/lib/validations/admin";
import { reviewCompany, setCollaborativeHiringEnabled, getCompanyDetail } from "@/lib/admin/companies";

/**
 * GET /api/admin/companies/[id] — company detail (docs/ADMIN-CONSOLE-PLAN.md
 * §4.3/§3, Phase 2): plan, jobs, members, risk signals, AI spend. Extends
 * this existing `[id]` route (which already carries the PATCH review/
 * collaborative-hiring-toggle actions) rather than adding a separate
 * `/detail` segment — GET for the read, PATCH for the actions, one resource.
 * `getCompanyDetail` itself writes the `COMPANY_RECORD_VIEWED` audit row.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await requireAdmin(session.user.id);

    const { id } = adminCompanyDetailParamsSchema.parse(await params);

    const detail = await getCompanyDetail(session.user.id, id);

    return NextResponse.json(detail);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await requireAdmin(session.user.id);
    const { id } = await params;
    const body = (await parseJsonBody(req)) as { action?: string; enabled?: boolean };
    const updated = body?.action === "set_collaborative_hiring"
      ? await setCollaborativeHiringEnabled(id, body.enabled === true)
      : await reviewCompany(session.user.id, id, body);
    return NextResponse.json(updated);
  } catch (error) {
    return errorResponse(error);
  }
}
