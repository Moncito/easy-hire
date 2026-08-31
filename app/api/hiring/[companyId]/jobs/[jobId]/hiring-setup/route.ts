import { NextResponse } from "next/server";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { parseJsonBody } from "@/lib/parse-json-body";
import { getHiringSetup, saveHiringSetup } from "@/lib/hiring-setup";
import { hiringSetupSchema } from "@/lib/validations/hiring-setup";

export async function GET(_request: Request, { params }: { params: Promise<{ companyId: string; jobId: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { companyId, jobId } = await params;
    return NextResponse.json(await getHiringSetup(companyId, session.user.id, jobId));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ companyId: string; jobId: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { companyId, jobId } = await params;
    const input = hiringSetupSchema.parse(await parseJsonBody(request));
    return NextResponse.json(await saveHiringSetup(companyId, session.user.id, jobId, input));
  } catch (error) {
    return errorResponse(error);
  }
}
