import { NextResponse } from "next/server";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { parseJsonBody } from "@/lib/parse-json-body";
import { requireEmployerCompany } from "@/lib/employer-auth";
import { addSeekerToTalentList } from "@/lib/employer/talent-lists";
import { ZodError } from "zod";

export async function POST(req: Request, { params }: { params: Promise<{ listId: string }> }) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "EMPLOYER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { listId } = await params;
    const company = await requireEmployerCompany(session.user.id);
    const body = await parseJsonBody(req);
    const item = await addSeekerToTalentList(company.id, listId, body);
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }
    return errorResponse(error);
  }
}
