import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { updateCollaborativePipeline } from "@/lib/collaborative-hiring-reviews";
import { collaborativePipelineSchema } from "@/lib/validations/collaborative-review";

export async function PATCH(request: Request, { params }: { params: Promise<{ companyId: string; jobId: string; applicationId: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { companyId, jobId, applicationId } = await params;
    return NextResponse.json(await updateCollaborativePipeline(companyId, session.user.id, jobId, applicationId, collaborativePipelineSchema.parse(await request.json())));
  } catch (error) {
    if (error instanceof ZodError) return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid pipeline update" }, { status: 400 });
    return errorResponse(error);
  }
}
