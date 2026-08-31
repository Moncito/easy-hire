import { NextResponse } from "next/server";
import { recordJobView, getSessionHashFromRequest } from "@/lib/employer-analytics";
import { ApiError, errorResponse } from "@/lib/api-error";
import { clientKeyFromRequest, enforceRateLimit } from "@/lib/rate-limit";

// Fully unauthenticated write — no session/user to key by and no cost like
// bcrypt to naturally slow an attacker down, so this gets the tightest
// window of the set: a short 60s bucket per IP, on top of the existing
// same-day sessionHash dedupe in recordJobView.
const JOB_VIEW_RATE_LIMIT = 20;
const JOB_VIEW_RATE_WINDOW_SECONDS = 60;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await enforceRateLimit({
      key: clientKeyFromRequest(req, "jobs:view"),
      limit: JOB_VIEW_RATE_LIMIT,
      windowSeconds: JOB_VIEW_RATE_WINDOW_SECONDS,
    });

    const { id } = await params;
    const sessionHash = await getSessionHashFromRequest();
    await recordJobView(id, sessionHash);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof ApiError) {
      return errorResponse(error);
    }
    console.error(error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
