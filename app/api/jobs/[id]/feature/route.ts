import { NextResponse } from "next/server";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { requireEmployerJob } from "@/lib/employer-auth";
import { featureJob, unfeatureJob } from "@/lib/jobs/featured";

/** POST /api/jobs/[id]/feature — Employer Pro: feature a job for 30 days. */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "EMPLOYER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { company } = await requireEmployerJob(session.user.id, id);
    const job = await featureJob(id, company.id);
    return NextResponse.json(job);
  } catch (error) {
    return errorResponse(error);
  }
}

/** DELETE /api/jobs/[id]/feature — remove an early featured placement. */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "EMPLOYER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { company } = await requireEmployerJob(session.user.id, id);
    const job = await unfeatureJob(id, company.id);
    return NextResponse.json(job);
  } catch (error) {
    return errorResponse(error);
  }
}
