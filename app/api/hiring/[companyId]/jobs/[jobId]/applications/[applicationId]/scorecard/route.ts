import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { saveCollaborativeCandidateEvaluation } from "@/lib/collaborative-hiring-reviews";
import { collaborativeScorecardSchema } from "@/lib/validations/collaborative-review";

export async function PUT(request: Request, { params }: { params: Promise<{ companyId: string; jobId: string; applicationId: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { companyId, jobId, applicationId } = await params;
    const input = collaborativeScorecardSchema.parse(await request.json());
    return NextResponse.json(await saveCollaborativeCandidateEvaluation(companyId, session.user.id, jobId, applicationId, input));
  } catch (error) {
    if (error instanceof ZodError) return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid scorecard" }, { status: 400 });
    return errorResponse(error);
  }
}
