import { NextResponse } from "next/server";
import { runDailyRollupsForAllCompanies } from "@/lib/employer/analytics-rollups";
import { clearExpiredFeaturedJobs } from "@/lib/jobs/featured";
import { requireCronAuth } from "@/lib/cron-auth";
import { errorResponse } from "@/lib/api-error";

/**
 * POST /api/cron/analytics-rollups — computes yesterday's AnalyticsDailyRollup
 * for every company and clears expired featured-job placements so the
 * public listing's `featuredUntil desc nulls last` ranking stays correct.
 * Intended to run once daily (e.g. Vercel Cron) shortly after midnight UTC.
 */
export async function POST(req: Request) {
  try {
    requireCronAuth(req);

    const [rollups, unfeatured] = await Promise.all([
      runDailyRollupsForAllCompanies(),
      clearExpiredFeaturedJobs(),
    ]);

    return NextResponse.json({ ok: true, rollups, unfeaturedJobs: unfeatured });
  } catch (error) {
    return errorResponse(error);
  }
}
