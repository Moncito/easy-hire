import { NextResponse } from "next/server";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { saveJob, unsaveJob } from "@/lib/saved-jobs";

export async function POST(_req: Request, { params }: { params: Promise<{ jobId: string }> }) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "SEEKER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobId } = await params;
    const result = await saveJob(session.user.id, jobId);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ jobId: string }> }) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "SEEKER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobId } = await params;
    const result = await unsaveJob(session.user.id, jobId);
    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}
