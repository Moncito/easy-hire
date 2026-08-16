import { NextResponse } from "next/server";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { requireEmployerCompany } from "@/lib/employer-auth";
import { removeSeekerFromTalentList } from "@/lib/employer/talent-lists";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ listId: string; seekerId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "EMPLOYER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { listId, seekerId } = await params;
    const company = await requireEmployerCompany(session.user.id);
    const result = await removeSeekerFromTalentList(company.id, listId, seekerId);
    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}
