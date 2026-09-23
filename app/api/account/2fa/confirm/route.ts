import { NextResponse } from "next/server";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { clientKeyFromRequest, enforceRateLimit } from "@/lib/rate-limit";
import { parseJsonBody } from "@/lib/parse-json-body";
import { twoFactorConfirmRequestSchema } from "@/lib/validations/account";
import { confirmTwoFactor } from "@/lib/auth/two-factor";

// A 6-digit code is guessable in principle — unlimited attempts would
// defeat the feature. Same shape as CHANGE_PASSWORD_RATE_LIMIT.
const CONFIRM_RATE_LIMIT = 10;
const CONFIRM_RATE_WINDOW_SECONDS = 60 * 60;

/**
 * POST /api/account/2fa/confirm
 * Verifies a 6-digit code against the secret from /enroll. Only on success:
 * sets totpEnabledAt, generates recovery codes, and returns them in
 * plaintext — the only response that ever does.
 */
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await enforceRateLimit({
      key: clientKeyFromRequest(req, "account:2fa:confirm", session.user.id),
      limit: CONFIRM_RATE_LIMIT,
      windowSeconds: CONFIRM_RATE_WINDOW_SECONDS,
    });

    const body = twoFactorConfirmRequestSchema.parse(await parseJsonBody(req));
    const result = await confirmTwoFactor(session.user.id, body.code);

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return errorResponse(error);
  }
}
