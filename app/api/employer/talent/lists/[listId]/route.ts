import { NextResponse } from "next/server";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { parseJsonBody } from "@/lib/parse-json-body";
import { requireEmployerCompany } from "@/lib/employer-auth";
import {
  getTalentListWithItems,
  renameTalentList,
  deleteTalentList,
} from "@/lib/employer/talent-lists";
import { ZodError } from "zod";

export async function GET(_req: Request, { params }: { params: Promise<{ listId: string }> }) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "EMPLOYER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { listId } = await params;
    const company = await requireEmployerCompany(session.user.id);
    const list = await getTalentListWithItems(company.id, listId);
    return NextResponse.json(list);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ listId: string }> }) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "EMPLOYER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { listId } = await params;
    const company = await requireEmployerCompany(session.user.id);
    const body = await parseJsonBody(req);
    const list = await renameTalentList(company.id, listId, body);
    return NextResponse.json(list);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }
    return errorResponse(error);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ listId: string }> }) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "EMPLOYER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { listId } = await params;
    const company = await requireEmployerCompany(session.user.id);
    const result = await deleteTalentList(company.id, listId);
    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}
