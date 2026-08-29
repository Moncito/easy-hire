import { NextResponse } from "next/server";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { clientKeyFromRequest, enforceRateLimit } from "@/lib/rate-limit";
import { parseJsonBody } from "@/lib/parse-json-body";
import { getMessagesAfter, sendMessage } from "@/lib/messages";

export const dynamic = "force-dynamic";

// Authenticated, but a spam vector for both parties in a conversation.
const SEND_MESSAGE_RATE_LIMIT = 30;
const SEND_MESSAGE_RATE_WINDOW_SECONDS = 10 * 60;

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user || !["EMPLOYER", "SEEKER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const after = new URL(req.url).searchParams.get("after") ?? undefined;
    const messages = await getMessagesAfter(session.user.id, session.user.role, id, after);
    return NextResponse.json(
      { messages },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user || !["EMPLOYER", "SEEKER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await enforceRateLimit({
      key: clientKeyFromRequest(req, "conversations:messages", session.user.id),
      limit: SEND_MESSAGE_RATE_LIMIT,
      windowSeconds: SEND_MESSAGE_RATE_WINDOW_SECONDS,
    });

    const { id } = await params;
    const body = await parseJsonBody(req);
    const message = await sendMessage(session.user.id, session.user.role, id, body);
    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
