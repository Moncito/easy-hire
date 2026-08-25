import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
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
    const input = hiringSetupSchema.parse(await request.json());
    return NextResponse.json(await saveHiringSetup(companyId, session.user.id, jobId, input));
  } catch (error) {
    if (error instanceof ZodError) return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    return errorResponse(error);
  }
}
