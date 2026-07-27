import { NextResponse } from "next/server";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { requireAdmin } from "@/lib/admin-auth";
import { listPendingCompanies } from "@/lib/admin/companies";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await requireAdmin(session.user.id);
    const companies = await listPendingCompanies();
    return NextResponse.json(companies);
  } catch (error) {
    return errorResponse(error);
  }
}
