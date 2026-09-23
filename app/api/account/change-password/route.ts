import { NextResponse } from "next/server";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { clientKeyFromRequest, enforceRateLimit } from "@/lib/rate-limit";
import { parseJsonBody } from "@/lib/parse-json-body";
import { changePasswordRequestSchema } from "@/lib/validations/account";
import { changePassword } from "@/lib/account/change-password";

// Guards password-guessing via repeated "current password" attempts — same
// shape as /api/account/delete's re-auth cap.
const CHANGE_PASSWORD_RATE_LIMIT = 5;
const CHANGE_PASSWORD_RATE_WINDOW_SECONDS = 60 * 60;

/**
 * POST /api/account/change-password
 * Signed-in password rotation. Accounts with a password (Credentials)
 * change it directly after verifying `currentPassword`. Google-only
 * accounts have no password to verify, so this falls back to the existing
 * email-based reset flow instead — see lib/account/change-password.ts for
 * the full branch and the `outcome` discriminant returned below.
 */
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await enforceRateLimit({
      key: clientKeyFromRequest(req, "account:change-password", session.user.id),
      limit: CHANGE_PASSWORD_RATE_LIMIT,
      windowSeconds: CHANGE_PASSWORD_RATE_WINDOW_SECONDS,
    });

    const body = changePasswordRequestSchema.parse(await parseJsonBody(req));
    const result = await changePassword(session.user.id, body);

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return errorResponse(error);
  }
}
