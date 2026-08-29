import { NextResponse } from "next/server";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { getCollaborativeJobForEdit, updateCollaborativeJob, deleteCollaborativeJob } from "@/lib/collaborative-job-management";

export async function GET(_request: Request, { params }: { params: Promise<{ companyId: string; jobId: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { companyId, jobId } = await params;
    const job = await getCollaborativeJobForEdit(companyId, session.user.id, jobId);
    return NextResponse.json(job);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ companyId: string; jobId: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { companyId, jobId } = await params;
    const job = await updateCollaborativeJob(companyId, session.user.id, jobId, await request.json());
    return NextResponse.json(job);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ companyId: string; jobId: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { companyId, jobId } = await params;
    await deleteCollaborativeJob(companyId, session.user.id, jobId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
