import { NextResponse } from "next/server";
import { sendJobAlertDigests } from "@/lib/job-alerts-digest";
import { requireCronAuth } from "@/lib/cron-auth";
import { errorResponse } from "@/lib/api-error";

/** POST /api/cron/job-alerts — protected digest sender for daily/weekly alerts. */
export async function POST(req: Request) {
  try {
    requireCronAuth(req);

    const { searchParams } = new URL(req.url);
    const frequency = searchParams.get("frequency") === "WEEKLY" ? "WEEKLY" : "DAILY";

    const result = await sendJobAlertDigests(frequency);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return errorResponse(error);
  }
}
