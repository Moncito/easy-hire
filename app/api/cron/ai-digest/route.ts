import { NextResponse } from "next/server";
import { sendWeeklyDigestToAllProCompanies } from "@/lib/ai/digest";
import { requireCronAuth } from "@/lib/cron-auth";
import { errorResponse } from "@/lib/api-error";
import { runTrackedCronJob } from "@/lib/admin/cron-runs";

/**
 * Sends the weekly Easy AI hiring digest to every active Pro company.
 * Intended to run once a week (e.g. Monday morning UTC). No-ops
 * per-company when Resend/AI provider keys aren't configured.
 *
 * Wrapped in `runTrackedCronJob` (job name "ai-digest", matching
 * `.github/workflows/cron-ai-digest.yml`) so the `/admin/system` health
 * screen has real run history for this job — see lib/admin/cron-runs.ts's
 * module doc comment for the reliability contract this gives: a broken
 * `cron_runs` write can never fail an otherwise-successful digest send, and
 * a thrown error is always recorded as FAILED before it propagates.
 */
async function handle(req: Request) {
  try {
    requireCronAuth(req);

    const result = await runTrackedCronJob("ai-digest", () => sendWeeklyDigestToAllProCompanies());
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
