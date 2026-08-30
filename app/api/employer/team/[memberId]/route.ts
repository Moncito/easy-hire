import { NextResponse } from "next/server";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { parseJsonBody } from "@/lib/parse-json-body";
import { requireEmployerCompany } from "@/lib/employer-auth";
import { updateMemberSchema } from "@/lib/validations/collaborative-hiring";
import { removeCompanyMember, updateCompanyMemberRole } from "@/lib/collaborative-hiring-team";

export async function PATCH(request: Request, { params }: { params: Promise<{ memberId: string }> }) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "EMPLOYER") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const company = await requireEmployerCompany(session.user.id);
    const { memberId } = await params;
    const { role } = updateMemberSchema.parse(await parseJsonBody(request));
    return NextResponse.json(await updateCompanyMemberRole(company.id, session.user.id, memberId, role));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ memberId: string }> }) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "EMPLOYER") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const company = await requireEmployerCompany(session.user.id);
    const { memberId } = await params;
    await removeCompanyMember(company.id, session.user.id, memberId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return errorResponse(error);
  }
}
