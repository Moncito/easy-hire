import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { requireConversationInCompany, annotateSenders } from "@/lib/collaborative-messages";
import { createMessageStreamResponse } from "@/lib/message-stream";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ companyId: string; conversationId: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return new Response("Unauthorized", { status: 401 });
    const { companyId, conversationId } = await params;

    const conversation = await requireConversationInCompany(companyId, session.user.id, conversationId);

    return createMessageStreamResponse({
      conversationId,
      actorUserId: session.user.id,
      seekerUserId: conversation.seeker.userId,
      companyId,
      companyOwnerUserId: conversation.company.userId,
      annotate: annotateSenders,
      signal: request.signal,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
