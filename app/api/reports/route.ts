import { NextResponse } from "next/server";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { clientKeyFromRequest, enforceRateLimit } from "@/lib/rate-limit";
import { parseJsonBody } from "@/lib/parse-json-body";
import { reportFileSchema } from "@/lib/validations/reports";
import { fileAbuseReport } from "@/lib/admin/abuse-reports";

/**
 * POST /api/reports — file an abuse report against a USER, JOB, COMPANY,
 * MESSAGE, or REVIEW. Signed-in users only, NOT admins — this is the public
 * surface for lib/admin/abuse-reports.ts's `fileAbuseReport` (see that
 * function's own doc comment for why it is deliberately not admin-gated).
 *
 * Rate-limited here (not inside `fileAbuseReport` — see that function's doc
 * comment for why rate limiting is a route-layer concern in this codebase),
 * same shape as every other authenticated, spam-prone POST endpoint (e.g.
 * `POST /api/reviews`). An unthrottled report endpoint is both a harassment
 * vector against the reported party and a spam vector against the
 * moderation queue.
 *
 * Thin handler: auth, rate limit, Zod-validate, call lib/admin/abuse-reports.ts,
 * respond. Input is treated as hostile — bounded `detail` length and a
 * `reason` validated against the controlled vocabulary happen at the Zod
 * boundary (`reportFileSchema`), then re-checked again inside
 * `fileAbuseReport` itself (defence in depth).
 */

const REPORT_FILE_RATE_LIMIT = 20;
const REPORT_FILE_RATE_WINDOW_SECONDS = 60 * 60;

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await enforceRateLimit({
      key: clientKeyFromRequest(req, "reports:file", session.user.id),
      limit: REPORT_FILE_RATE_LIMIT,
      windowSeconds: REPORT_FILE_RATE_WINDOW_SECONDS,
    });

    const body = await parseJsonBody(req);
    const input = reportFileSchema.parse(body);

    const report = await fileAbuseReport({
      reporterUserId: session.user.id,
      targetType: input.targetType,
      targetId: input.targetId,
      reason: input.reason,
      detail: input.detail,
    });

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
