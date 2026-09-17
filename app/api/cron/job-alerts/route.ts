import { NextResponse } from "next/server";
import { sendJobAlertDigests } from "@/lib/job-alerts-digest";
import { requireCronAuth } from "@/lib/cron-auth";
import { errorResponse } from "@/lib/api-error";
import { runTrackedCronJob } from "@/lib/admin/cron-runs";

/**
 * Shared handler — Vercel Cron issues GET requests; POST stays available for
 * manual triggering. Two GitHub Actions workflows (daily and weekly) both
 * call this one route with a different `?frequency=`, and both are tracked
 * under the single "job-alerts" cron_runs job name (see
 * lib/admin/cron-runs.ts's module doc comment for why); `frequency` is
 * carried into the SUCCESS row's `detail` so a "job-alerts" health tile
 * doesn't conflate a daily miss with a weekly one.
 */
async function handle(req: Request) {
  try {
    requireCronAuth(req);

    const { searchParams } = new URL(req.url);
    const frequency = searchParams.get("frequency") === "WEEKLY" ? "WEEKLY" : "DAILY";

    const result = await runTrackedCronJob("job-alerts", () => sendJobAlertDigests(frequency), {
      detail: (r) => ({ frequency, ...r }),
    });
    return NextResponse.json({ ok: true, frequency, ...result });
  } catch (error) {
    return errorResponse(error);
  }
}

/** GET /api/cron/job-alerts?frequency=DAILY|WEEKLY — invoked by Vercel Cron. */
export async function GET(req: Request) {
  return handle(req);
}

/** POST /api/cron/job-alerts — protected digest sender for daily/weekly alerts (manual trigger). */
export async function POST(req: Request) {
  return handle(req);
}
