import { NextResponse } from "next/server";
import { auth } from "@/Auth";
import { errorResponse } from "@/lib/api-error";
import { clientKeyFromRequest, enforceRateLimit } from "@/lib/rate-limit";
import { buildUserDataExport, logAccountDataExport } from "@/lib/account/data-export";

// Expensive query (pulls every table the account touches) — kept tight and
// namespaced separately from other rate limits.
const EXPORT_RATE_LIMIT = 3;
const EXPORT_RATE_WINDOW_SECONDS = 60 * 60;

/**
 * GET /api/account/export
 * RA 10173 data-subject export — the signed-in user's own account data as a
 * downloadable JSON file. Every call is written to ExportAuditLog (employer
 * accounts) or logged server-side (seeker accounts — see
 * lib/account/data-export.ts for why).
 */
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await enforceRateLimit({
      key: clientKeyFromRequest(req, "account:export", session.user.id),
      limit: EXPORT_RATE_LIMIT,
      windowSeconds: EXPORT_RATE_WINDOW_SECONDS,
    });

    const payload = await buildUserDataExport(session.user.id);
    await logAccountDataExport(session.user.id);

    const filename = `easyhire-data-export-${session.user.id}.json`;

    return new NextResponse(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
