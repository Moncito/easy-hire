import { NextResponse } from "next/server";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { parseJsonBody } from "@/lib/parse-json-body";
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
    const conversation = await createOrGetCollaborativeConversation(companyId, session.user.id, await parseJsonBody(request));
    return NextResponse.json(conversation);
  } catch (error) {
    return errorResponse(error);
  }
}
