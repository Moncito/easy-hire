import { NextResponse } from "next/server";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { parseJsonBody } from "@/lib/parse-json-body";
import { requireAdmin } from "@/lib/admin-auth";
import { reviewJob } from "@/lib/admin/jobs";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await requireAdmin(session.user.id);
    const { id } = await params;
    const body = await parseJsonBody(req);
    const updated = await reviewJob(id, body);
    return NextResponse.json(updated);
  } catch (error) {
    return errorResponse(error);
  }
}
