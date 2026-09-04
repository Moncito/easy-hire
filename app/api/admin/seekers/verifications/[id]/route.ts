import { NextResponse } from "next/server";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { parseJsonBody } from "@/lib/parse-json-body";
import { requireAdmin } from "@/lib/admin-auth";
import { reviewSeekerVerification } from "@/lib/admin/seekers";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await requireAdmin(session.user.id);
    const { id } = await params;
    const body = await parseJsonBody(req);
    const updated = await reviewSeekerVerification(id, body);
    return NextResponse.json(updated);
  } catch (error) {
    return errorResponse(error);
  }
}
