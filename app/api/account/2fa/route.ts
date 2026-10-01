import { NextResponse } from "next/server";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { getTwoFactorStatus } from "@/lib/auth/two-factor";

/**
 * GET /api/account/2fa
 * Status only — whether 2FA is enabled and how many unused recovery codes
 * remain. Never returns the secret or any code, hashed or otherwise. See
 * lib/auth/two-factor.ts for enroll/confirm/disable.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const status = await getTwoFactorStatus(session.user.id);
    return NextResponse.json(status);
  } catch (error) {
    return errorResponse(error);
  }
}
