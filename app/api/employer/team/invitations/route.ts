import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { requireEmployerCompany } from "@/lib/employer-auth";
import { createInvitationSchema } from "@/lib/validations/collaborative-hiring";
import { inviteCompanyMember } from "@/lib/collaborative-hiring-team";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "EMPLOYER") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const company = await requireEmployerCompany(session.user.id);
    const input = createInvitationSchema.parse(await request.json());
    const invitation = await inviteCompanyMember(company.id, session.user.id, input);
    return NextResponse.json(invitation, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    return errorResponse(error);
  }
}
