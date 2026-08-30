import { NextResponse } from "next/server";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { clientKeyFromRequest, enforceRateLimit } from "@/lib/rate-limit";
import { parseJsonBody } from "@/lib/parse-json-body";
import { listConversationsForUserCached } from "@/lib/conversations-cache";
import { createOrGetConversation } from "@/lib/messages";

export const dynamic = "force-dynamic";

// Conversation creation is now reachable by seekers as well as employers —
// same order of magnitude as the per-thread message limit (Phase 1.4), since
// an unbounded seeker could otherwise spray "create conversation" calls at
// every company they've ever applied to.
const CREATE_CONVERSATION_RATE_LIMIT = 20;
const CREATE_CONVERSATION_RATE_WINDOW_SECONDS = 10 * 60;

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || !["EMPLOYER", "SEEKER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const conversations = await listConversationsForUserCached(session.user.id, session.user.role);
    return NextResponse.json(
      { conversations },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user || !["EMPLOYER", "SEEKER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await enforceRateLimit({
      key: clientKeyFromRequest(req, "conversations:create", session.user.id),
      limit: CREATE_CONVERSATION_RATE_LIMIT,
      windowSeconds: CREATE_CONVERSATION_RATE_WINDOW_SECONDS,
    });

    const body = await parseJsonBody(req);
    const conversation = await createOrGetConversation(session.user.id, session.user.role, body);
    return NextResponse.json(conversation, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
