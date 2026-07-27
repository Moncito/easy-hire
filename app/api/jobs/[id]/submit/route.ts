import { NextResponse } from "next/server";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { requireEmployerJob } from "@/lib/employer-auth";
import { submitJobForReview } from "@/lib/jobs";

export async function PATCH(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "EMPLOYER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { job } = await requireEmployerJob(session.user.id, id);
    const updated = await submitJobForReview(job);
    return NextResponse.json(updated);
  } catch (error) {
    return errorResponse(error);
  }
}
