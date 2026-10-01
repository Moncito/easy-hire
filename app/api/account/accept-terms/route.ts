import { NextResponse } from "next/server";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { clientKeyFromRequest, enforceRateLimit } from "@/lib/rate-limit";
import { parseJsonBody } from "@/lib/parse-json-body";
import { acceptTermsSchema } from "@/lib/validations/legal";
import { acceptCurrentTerms } from "@/lib/legal/terms-acceptance";

const ACCEPT_TERMS_RATE_LIMIT = 20;
const ACCEPT_TERMS_RATE_WINDOW_SECONDS = 60 * 60;

/**
 * POST /api/account/accept-terms
 * Records acceptance of the current Terms/Privacy for any signed-in user. The
 * client must then call `update()` so the JWT picks up the new termsVersion.
 */
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await enforceRateLimit({
      key: clientKeyFromRequest(req, "account:accept-terms", session.user.id),
      limit: ACCEPT_TERMS_RATE_LIMIT,
      windowSeconds: ACCEPT_TERMS_RATE_WINDOW_SECONDS,
    });

    const { version } = acceptTermsSchema.parse(await parseJsonBody(req));
    const result = await acceptCurrentTerms(session.user.id, version);

    return NextResponse.json({ ok: true, version: result.version });
  } catch (error) {
    return errorResponse(error);
  }
}
