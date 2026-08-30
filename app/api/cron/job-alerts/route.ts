import { NextResponse } from "next/server";
import { sendJobAlertDigests } from "@/lib/job-alerts-digest";
import { requireCronAuth } from "@/lib/cron-auth";
import { errorResponse } from "@/lib/api-error";

/** Shared handler — Vercel Cron issues GET requests; POST stays available for manual triggering. */
async function handle(req: Request) {
  try {
    requireCronAuth(req);

    const { searchParams } = new URL(req.url);
    const frequency = searchParams.get("frequency") === "WEEKLY" ? "WEEKLY" : "DAILY";

    const result = await sendJobAlertDigests(frequency);
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
