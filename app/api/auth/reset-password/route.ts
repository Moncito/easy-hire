import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/api-error";
import { clientKeyFromRequest, enforceRateLimit } from "@/lib/rate-limit";
import { parseJsonBody } from "@/lib/parse-json-body";
import { resetPasswordSchema } from "@/lib/validations/credentials-recovery";
import { resetPassword } from "@/lib/auth/credentials-recovery";

// Unauthenticated + runs bcrypt.hash(cost 10) per call — keep this tight.
const RESET_PASSWORD_RATE_LIMIT = 10;
const RESET_PASSWORD_RATE_WINDOW_SECONDS = 60 * 60;

export async function POST(req: Request) {
  try {
    await enforceRateLimit({
      key: clientKeyFromRequest(req, "reset-password"),
      limit: RESET_PASSWORD_RATE_LIMIT,
      windowSeconds: RESET_PASSWORD_RATE_WINDOW_SECONDS,
    });

    const body = await parseJsonBody(req);
    const { token, password } = resetPasswordSchema.parse(body);

    await resetPassword(token, password);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
