import { NextResponse } from "next/server";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { parseJsonBody } from "@/lib/parse-json-body";
import { clientKeyFromRequest, enforceRateLimit } from "@/lib/rate-limit";
import { respondToOffer } from "@/lib/hiring/offers";

const RESPOND_RATE_LIMIT = 30;
const RESPOND_RATE_WINDOW_SECONDS = 60 * 60;

export async function POST(req: Request, { params }: { params: Promise<{ offerId: string }> }) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "SEEKER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await enforceRateLimit({
      key: clientKeyFromRequest(req, "offers:respond", session.user.id),
      limit: RESPOND_RATE_LIMIT,
      windowSeconds: RESPOND_RATE_WINDOW_SECONDS,
    });

    const { offerId } = await params;
    const body = await parseJsonBody(req);
    const result = await respondToOffer(session.user.id, offerId, body);
    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}
