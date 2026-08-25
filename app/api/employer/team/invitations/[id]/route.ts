import { NextResponse } from "next/server";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { requireEmployerCompany } from "@/lib/employer-auth";
import { revokeCompanyInvitation } from "@/lib/collaborative-hiring-team";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "EMPLOYER") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const company = await requireEmployerCompany(session.user.id);
    const { id } = await params;
    await revokeCompanyInvitation(company.id, session.user.id, id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return errorResponse(error);
  }
}
