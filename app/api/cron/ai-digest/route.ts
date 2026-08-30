import { NextResponse } from "next/server";
import { sendWeeklyDigestToAllProCompanies } from "@/lib/ai/digest";
import { requireCronAuth } from "@/lib/cron-auth";
import { errorResponse } from "@/lib/api-error";

/**
 * Sends the weekly Easy AI hiring digest to every active Pro company.
 * Intended to run once a week (e.g. Monday morning UTC). No-ops
 * per-company when Resend/AI provider keys aren't configured.
 */
async function handle(req: Request) {
  try {
    requireCronAuth(req);

    const result = await sendWeeklyDigestToAllProCompanies();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return errorResponse(error);
  }
}

/** GET /api/cron/ai-digest — invoked by Vercel Cron. */
export async function GET(req: Request) {
  return handle(req);
}

/** POST /api/cron/ai-digest — same as GET, kept for manual triggering. */
export async function POST(req: Request) {
  return handle(req);
}
