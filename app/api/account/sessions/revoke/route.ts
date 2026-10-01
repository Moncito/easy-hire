import { NextResponse } from "next/server";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { clientKeyFromRequest, enforceRateLimit } from "@/lib/rate-limit";
import { revokeSessions } from "@/lib/auth/session-revocation";
import { keepCurrentSession } from "@/lib/auth/keep-current-session";

// Harmless to repeat, but each call is two writes and a cookie re-issue.
const REVOKE_SESSIONS_RATE_LIMIT = 10;
const REVOKE_SESSIONS_RATE_WINDOW_SECONDS = 60 * 60;

/**
 * POST /api/account/sessions/revoke
 * "Sign out of other devices". Stamps the revocation cutoff, then re-issues
 * this device's token so only the others are signed out. No re-auth: ending
 * sessions can only take access away, never grant it.
 */
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await enforceRateLimit({
      key: clientKeyFromRequest(req, "account:revoke-sessions", session.user.id),
      limit: REVOKE_SESSIONS_RATE_LIMIT,
      windowSeconds: REVOKE_SESSIONS_RATE_WINDOW_SECONDS,
    });

    await revokeSessions(session.user.id);
    await keepCurrentSession(session.user.id);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
