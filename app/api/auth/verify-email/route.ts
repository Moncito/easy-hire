import { NextResponse } from "next/server";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { clientKeyFromRequest, enforceRateLimit } from "@/lib/rate-limit";
import { requestEmailVerification } from "@/lib/auth/credentials-recovery";

// Authenticated resend — keyed by user id, not IP, since the account is known.
const VERIFY_EMAIL_RESEND_RATE_LIMIT = 5;
const VERIFY_EMAIL_RESEND_RATE_WINDOW_SECONDS = 60 * 60;

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await enforceRateLimit({
      key: clientKeyFromRequest(req, "verify-email-resend", session.user.id),
      limit: VERIFY_EMAIL_RESEND_RATE_LIMIT,
      windowSeconds: VERIFY_EMAIL_RESEND_RATE_WINDOW_SECONDS,
    });

    await requestEmailVerification(session.user.id);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
