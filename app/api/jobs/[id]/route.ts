import { NextResponse } from "next/server";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { requireEmployerJob } from "@/lib/employer-auth";
import { updateJob, updateJobStatus, deleteDraftJob } from "@/lib/jobs";
import { jobStatusUpdateSchema } from "@/lib/validations/job";
import { ZodError } from "zod";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "EMPLOYER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { job } = await requireEmployerJob(session.user.id, id);
    return NextResponse.json(job);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "EMPLOYER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { job: existingJob, company } = await requireEmployerJob(session.user.id, id);
    const body = await req.json();

    if (body.status && Object.keys(body).length === 1) {
      const { status } = jobStatusUpdateSchema.parse(body);
      const updatedJob = await updateJobStatus(id, status, existingJob.status, company.id);
      return NextResponse.json(updatedJob);
    }

    const updatedJob = await updateJob(id, existingJob.status, body, company.id);
    return NextResponse.json(updatedJob);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }
    return errorResponse(error);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "EMPLOYER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { job, company } = await requireEmployerJob(session.user.id, id);
    await deleteDraftJob(id, job.status, company.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
