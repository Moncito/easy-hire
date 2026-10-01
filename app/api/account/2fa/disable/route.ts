import { NextResponse } from "next/server";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { clientKeyFromRequest, enforceRateLimit } from "@/lib/rate-limit";
import { parseJsonBody } from "@/lib/parse-json-body";
import { twoFactorDisableRequestSchema } from "@/lib/validations/account";
import { disableTwoFactor } from "@/lib/auth/two-factor";

// Guards password/code-guessing via repeated disable attempts — same shape
// as CHANGE_PASSWORD_RATE_LIMIT and DELETE_RATE_LIMIT.
const DISABLE_RATE_LIMIT = 5;
const DISABLE_RATE_WINDOW_SECONDS = 60 * 60;

/**
 * POST /api/account/2fa/disable
 * Requires re-authentication: current password, or a valid TOTP code. On
 * success clears totpSecret/totpEnabledAt and deletes the user's recovery
 * codes.
 */
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await enforceRateLimit({
      key: clientKeyFromRequest(req, "account:2fa:disable", session.user.id),
      limit: DISABLE_RATE_LIMIT,
      windowSeconds: DISABLE_RATE_WINDOW_SECONDS,
    });

    const body = twoFactorDisableRequestSchema.parse(await parseJsonBody(req));
    await disableTwoFactor(session.user.id, body);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
