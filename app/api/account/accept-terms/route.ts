import { NextResponse } from "next/server";
import { auth, unstable_update } from "@/Auth";
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
 * route re-issues the session cookie itself so the JWT carries the new
 * termsVersion on the very next request.
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

    // Re-issue this device's session cookie now, so the jwt callback re-reads
    // termsVersion before the client navigates. Otherwise proxy.ts still sees
    // the cached (pre-accept) version for up to the 15-minute role refresh
    // and bounces the user straight back to /accept-terms.
    await unstable_update({});

    return NextResponse.json({ ok: true, version: result.version });
  } catch (error) {
    return errorResponse(error);
  }
}
