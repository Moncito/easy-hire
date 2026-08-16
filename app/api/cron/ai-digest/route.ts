import { NextResponse } from "next/server";
import { sendWeeklyDigestToAllProCompanies } from "@/lib/ai/digest";

const CRON_SECRET = process.env.CRON_SECRET;

/**
 * POST /api/cron/ai-digest — sends the weekly Easy AI hiring digest to every
 * active Pro company. Intended to run once a week (e.g. Monday morning UTC).
 * No-ops per-company when Resend/AI provider keys aren't configured.
 */
export async function POST(req: Request) {
  if (CRON_SECRET) {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const result = await sendWeeklyDigestToAllProCompanies();
  return NextResponse.json({ ok: true, ...result });
}
