import { NextResponse } from "next/server";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { clientKeyFromRequest, enforceRateLimit } from "@/lib/rate-limit";
import { enrollTwoFactor } from "@/lib/auth/two-factor";

// Cheap to call repeatedly (it's just secret generation + a QR render), but
// still worth a cap — same shape as every other account-security route.
const ENROLL_RATE_LIMIT = 10;
const ENROLL_RATE_WINDOW_SECONDS = 60 * 60;

/**
 * POST /api/account/2fa/enroll
 * Generates a TOTP secret, stores it encrypted, and returns the `otpauth://`
 * URI plus a QR data URL. Does NOT enable 2FA — see confirm/route.ts. No
 * request body.
 */
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await enforceRateLimit({
      key: clientKeyFromRequest(req, "account:2fa:enroll", session.user.id),
      limit: ENROLL_RATE_LIMIT,
      windowSeconds: ENROLL_RATE_WINDOW_SECONDS,
    });

    const result = await enrollTwoFactor(session.user.id);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return errorResponse(error);
  }
}
