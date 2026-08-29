import { NextResponse } from "next/server";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { getCollaborativeMessagesAfter, sendCollaborativeMessage } from "@/lib/collaborative-messages";

export async function GET(request: Request, { params }: { params: Promise<{ companyId: string; conversationId: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { companyId, conversationId } = await params;
    const after = new URL(request.url).searchParams.get("after") ?? undefined;
    const messages = await getCollaborativeMessagesAfter(companyId, session.user.id, conversationId, after);
    return NextResponse.json({ messages });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ companyId: string; conversationId: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { companyId, conversationId } = await params;
    const message = await sendCollaborativeMessage(companyId, session.user.id, conversationId, await request.json());
    return NextResponse.json({ message });
  } catch (error) {
    return errorResponse(error);
  }
}
