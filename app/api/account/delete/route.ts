import { NextResponse } from "next/server";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { clientKeyFromRequest, enforceRateLimit } from "@/lib/rate-limit";
import { parseJsonBody } from "@/lib/parse-json-body";
import { accountDeletionRequestSchema } from "@/lib/validations/account";
import { deleteUserAccount } from "@/lib/account/account-deletion";

// Destructive and re-auth-gated already, but still worth a tight cap against
// password-guessing via repeated deletion attempts.
const DELETE_RATE_LIMIT = 5;
const DELETE_RATE_WINDOW_SECONDS = 60 * 60;

/**
 * POST /api/account/delete
 * RA 10173 right-to-erasure — irreversible. Requires re-authentication
 * (current password, or a typed confirmation phrase for Google-only
 * accounts). See lib/account/account-deletion.ts for exactly what is
 * hard-deleted vs. anonymized vs. preserved.
 */
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await enforceRateLimit({
      key: clientKeyFromRequest(req, "account:delete", session.user.id),
      limit: DELETE_RATE_LIMIT,
      windowSeconds: DELETE_RATE_WINDOW_SECONDS,
    });

    const body = accountDeletionRequestSchema.parse(await parseJsonBody(req));
    const result = await deleteUserAccount(session.user.id, body);

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return errorResponse(error);
  }
}
