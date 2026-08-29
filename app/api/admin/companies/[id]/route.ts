import { NextResponse } from "next/server";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { requireAdmin } from "@/lib/admin-auth";
import { reviewCompany, setCollaborativeHiringEnabled } from "@/lib/admin/companies";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await requireAdmin(session.user.id);
    const { id } = await params;
    const body = await req.json();
    const updated = body?.action === "set_collaborative_hiring"
      ? await setCollaborativeHiringEnabled(id, body.enabled === true)
      : await reviewCompany(id, body);
    return NextResponse.json(updated);
  } catch (error) {
    return errorResponse(error);
  }
}
