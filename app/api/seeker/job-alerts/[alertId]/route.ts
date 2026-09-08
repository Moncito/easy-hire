import { NextResponse } from "next/server";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { parseJsonBody } from "@/lib/parse-json-body";
import { deleteJobAlert, updateJobAlert } from "@/lib/job-alerts";

export async function PATCH(req: Request, { params }: { params: Promise<{ alertId: string }> }) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "SEEKER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { alertId } = await params;
    const body = await parseJsonBody(req);
    const result = await updateJobAlert(session.user.id, alertId, body);
    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ alertId: string }> }) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "SEEKER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { alertId } = await params;
    const result = await deleteJobAlert(session.user.id, alertId);
    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}
