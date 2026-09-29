import { NextResponse } from "next/server";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { parseJsonBody } from "@/lib/parse-json-body";
import { requireEmployerCompany } from "@/lib/employer-auth";
import { getHiringDefaults, saveHiringDefaults } from "@/lib/employer/hiring-defaults";

/**
 * GET/PUT /api/employer/hiring-defaults — the company owner's pre-fills for
 * new jobs, the reject dialog, and the "application received" email. PUT
 * replaces the whole set; the Settings form always sends every field.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "EMPLOYER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const company = await requireEmployerCompany(session.user.id);
    return NextResponse.json(await getHiringDefaults(company.id));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(req: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "EMPLOYER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const company = await requireEmployerCompany(session.user.id);
    return NextResponse.json(await saveHiringDefaults(company.id, await parseJsonBody(req)));
  } catch (error) {
    return errorResponse(error);
  }
}
