import { NextResponse } from "next/server";
import { sendJobAlertDigests } from "@/lib/job-alerts-digest";

const CRON_SECRET = process.env.CRON_SECRET;

/** POST /api/cron/job-alerts — protected digest sender for daily/weekly alerts. */
export async function POST(req: Request) {
  if (CRON_SECRET) {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const { searchParams } = new URL(req.url);
  const frequency = searchParams.get("frequency") === "WEEKLY" ? "WEEKLY" : "DAILY";

  const result = await sendJobAlertDigests(frequency);
  return NextResponse.json({ ok: true, ...result });
}
