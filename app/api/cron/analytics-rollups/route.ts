import { NextResponse } from "next/server";
import { runDailyRollupsForAllCompanies } from "@/lib/employer/analytics-rollups";
import { clearExpiredFeaturedJobs } from "@/lib/jobs/featured";

const CRON_SECRET = process.env.CRON_SECRET;

/**
 * POST /api/cron/analytics-rollups — computes yesterday's AnalyticsDailyRollup
 * for every company and clears expired featured-job placements so the
 * public listing's `featuredUntil desc nulls last` ranking stays correct.
 * Intended to run once daily (e.g. Vercel Cron) shortly after midnight UTC.
 */
export async function POST(req: Request) {
  if (CRON_SECRET) {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const [rollups, unfeatured] = await Promise.all([
    runDailyRollupsForAllCompanies(),
    clearExpiredFeaturedJobs(),
  ]);

  return NextResponse.json({ ok: true, rollups, unfeaturedJobs: unfeatured });
}
