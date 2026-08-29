import { NextResponse } from "next/server";
import { sendWeeklyDigestToAllProCompanies } from "@/lib/ai/digest";
import { requireCronAuth } from "@/lib/cron-auth";
import { errorResponse } from "@/lib/api-error";

/**
 * POST /api/cron/ai-digest — sends the weekly Easy AI hiring digest to every
 * active Pro company. Intended to run once a week (e.g. Monday morning UTC).
 * No-ops per-company when Resend/AI provider keys aren't configured.
 */
export async function POST(req: Request) {
  try {
    requireCronAuth(req);

    const result = await sendWeeklyDigestToAllProCompanies();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return errorResponse(error);
  }
}
