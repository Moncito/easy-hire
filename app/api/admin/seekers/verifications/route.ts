import { NextResponse } from "next/server";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { requireAdminWithPermission } from "@/lib/admin-auth";
import { listPendingSeekerVerifications } from "@/lib/admin/seekers";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await requireAdminWithPermission(session.user.id, "document.view");
    const profiles = await listPendingSeekerVerifications(session.user.id);
    return NextResponse.json(profiles);
  } catch (error) {
    return errorResponse(error);
  }
}
