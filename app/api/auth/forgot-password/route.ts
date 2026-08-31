import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/api-error";
import { clientKeyFromRequest, enforceRateLimit } from "@/lib/rate-limit";
import { parseJsonBody } from "@/lib/parse-json-body";
import { forgotPasswordSchema } from "@/lib/validations/credentials-recovery";
import { requestPasswordReset } from "@/lib/auth/credentials-recovery";

// Unauthenticated — keyed by IP *and* by the submitted email so one attacker
// can't spray many accounts from a single IP, and one account can't be
// spammed with reset emails from many IPs (mirrors Auth.ts's login guard).
const FORGOT_PASSWORD_RATE_LIMIT_PER_IP = 10;
const FORGOT_PASSWORD_RATE_LIMIT_PER_EMAIL = 5;
const FORGOT_PASSWORD_RATE_WINDOW_SECONDS = 60 * 60;

export async function POST(req: Request) {
  try {
    await enforceRateLimit({
      key: clientKeyFromRequest(req, "forgot-password"),
      limit: FORGOT_PASSWORD_RATE_LIMIT_PER_IP,
      windowSeconds: FORGOT_PASSWORD_RATE_WINDOW_SECONDS,
    });

    const body = await parseJsonBody(req);
    const { email } = forgotPasswordSchema.parse(body);

    await enforceRateLimit({
      key: `forgot-password:email:${email}`,
      limit: FORGOT_PASSWORD_RATE_LIMIT_PER_EMAIL,
      windowSeconds: FORGOT_PASSWORD_RATE_WINDOW_SECONDS,
    });

    // Always succeeds regardless of whether the account exists — see
    // requestPasswordReset's doc comment for why (no user enumeration).
    await requestPasswordReset(email);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
