import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { createOrGetCollaborativeConversation, listCollaborativeConversations } from "@/lib/collaborative-messages";

export async function GET(_request: Request, { params }: { params: Promise<{ companyId: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { companyId } = await params;
    const conversations = await listCollaborativeConversations(companyId, session.user.id);
    return NextResponse.json({ conversations });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ companyId: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { companyId } = await params;
    const conversation = await createOrGetCollaborativeConversation(companyId, session.user.id, await request.json());
    return NextResponse.json(conversation);
  } catch (error) {
    if (error instanceof ZodError) return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    return errorResponse(error);
  }
}
