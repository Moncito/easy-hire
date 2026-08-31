import { NextResponse } from "next/server";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { requireEmployerCompany } from "@/lib/employer-auth";
import { listCollaborativeTeam } from "@/lib/collaborative-hiring-team";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "EMPLOYER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const company = await requireEmployerCompany(session.user.id);
    return NextResponse.json(await listCollaborativeTeam(company.id, session.user.id));
  } catch (error) {
    return errorResponse(error);
  }
}
