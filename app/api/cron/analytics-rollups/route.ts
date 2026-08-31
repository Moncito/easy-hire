import { NextResponse } from "next/server";
import { runDailyRollupsForAllCompanies } from "@/lib/employer/analytics-rollups";
import { clearExpiredFeaturedJobs } from "@/lib/jobs/featured";
import { requireCronAuth } from "@/lib/cron-auth";
import { errorResponse } from "@/lib/api-error";

/**
 * Computes yesterday's AnalyticsDailyRollup for every company and clears
 * expired featured-job placements so the public listing's `featuredUntil
 * desc nulls last` ranking stays correct. Intended to run once daily
 * shortly after midnight UTC.
 */
async function runRollups() {
  const [rollups, unfeatured] = await Promise.all([
    runDailyRollupsForAllCompanies(),
    clearExpiredFeaturedJobs(),
  ]);

  return NextResponse.json({ ok: true, rollups, unfeaturedJobs: unfeatured });
}

/** GET /api/cron/analytics-rollups — invoked by Vercel Cron. */
export async function GET(req: Request) {
  try {
    requireCronAuth(req);
    return await runRollups();
  } catch (error) {
    return errorResponse(error);
  }
}

/** POST /api/cron/analytics-rollups — same as GET, kept for manual triggering. */
export async function POST(req: Request) {
  try {
    requireCronAuth(req);
    return await runRollups();
  } catch (error) {
    return errorResponse(error);
  }
}
