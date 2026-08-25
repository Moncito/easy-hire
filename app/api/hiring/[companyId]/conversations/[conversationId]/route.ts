import { NextResponse } from "next/server";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { getCollaborativeConversationThread } from "@/lib/collaborative-messages";

export async function GET(_request: Request, { params }: { params: Promise<{ companyId: string; conversationId: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { companyId, conversationId } = await params;
    const thread = await getCollaborativeConversationThread(companyId, session.user.id, conversationId);
    return NextResponse.json(thread);
  } catch (error) {
    return errorResponse(error);
  }
}
