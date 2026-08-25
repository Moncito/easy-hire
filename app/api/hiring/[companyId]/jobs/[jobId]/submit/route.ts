import { NextResponse } from "next/server";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { submitCollaborativeJobForReview } from "@/lib/collaborative-job-management";

export async function PATCH(_request: Request, { params }: { params: Promise<{ companyId: string; jobId: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { companyId, jobId } = await params;
    const job = await submitCollaborativeJobForReview(companyId, session.user.id, jobId);
    return NextResponse.json(job);
  } catch (error) {
    return errorResponse(error);
  }
}
