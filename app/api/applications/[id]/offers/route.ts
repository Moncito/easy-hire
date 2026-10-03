import { NextResponse } from "next/server";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { parseJsonBody } from "@/lib/parse-json-body";
import { clientKeyFromRequest, enforceRateLimit } from "@/lib/rate-limit";
import { createOffer, listOffersForApplication } from "@/lib/hiring/offers";

const OFFER_RATE_LIMIT = 20;
const OFFER_RATE_WINDOW_SECONDS = 60 * 60;

// Authorization (company owner or permitted team member) lives in lib/hiring/offers.ts.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await enforceRateLimit({
      key: clientKeyFromRequest(req, "offers:create", session.user.id),
      limit: OFFER_RATE_LIMIT,
      windowSeconds: OFFER_RATE_WINDOW_SECONDS,
    });

    const { id } = await params;
    const body = await parseJsonBody(req);
    const offer = await createOffer(session.user.id, id, body);
    return NextResponse.json(offer, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const offers = await listOffersForApplication(session.user.id, id);
    return NextResponse.json(offers);
  } catch (error) {
    return errorResponse(error);
  }
}
