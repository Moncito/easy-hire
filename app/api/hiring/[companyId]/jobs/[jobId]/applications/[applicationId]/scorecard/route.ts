import { NextResponse } from "next/server";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { parseJsonBody } from "@/lib/parse-json-body";
import { saveCollaborativeCandidateEvaluation } from "@/lib/collaborative-hiring-reviews";
import { collaborativeScorecardSchema } from "@/lib/validations/collaborative-review";

export async function PUT(request: Request, { params }: { params: Promise<{ companyId: string; jobId: string; applicationId: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { companyId, jobId, applicationId } = await params;
    const input = collaborativeScorecardSchema.parse(await parseJsonBody(request));
    return NextResponse.json(await saveCollaborativeCandidateEvaluation(companyId, session.user.id, jobId, applicationId, input));
  } catch (error) {
    return errorResponse(error);
  }
}
