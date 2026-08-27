import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { requireConversationAccess, annotateSenders } from "@/lib/messages";
import { createMessageStreamResponse } from "@/lib/message-stream";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user || !["EMPLOYER", "SEEKER"].includes(session.user.role)) {
      return new Response("Unauthorized", { status: 401 });
    }
    const { id: conversationId } = await params;

    const conversation = await requireConversationAccess(session.user.id, session.user.role, conversationId);

    return createMessageStreamResponse({
      conversationId,
      actorUserId: session.user.id,
      seekerUserId: conversation.seeker.userId,
      companyId: conversation.company.id,
      companyOwnerUserId: conversation.company.userId,
      annotate: annotateSenders,
      signal: request.signal,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
