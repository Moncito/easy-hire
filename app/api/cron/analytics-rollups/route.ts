import { NextResponse } from "next/server";
import { runDailyRollupsForAllCompanies } from "@/lib/employer/analytics-rollups";
import { runResponseMetricsForAllCompanies } from "@/lib/employer/response-metrics";
import { clearExpiredFeaturedJobs } from "@/lib/jobs/featured";
import { sweepExpiredReviewReveals } from "@/lib/reviews";
import { requireCronAuth } from "@/lib/cron-auth";
import { errorResponse } from "@/lib/api-error";
import { runTrackedCronJob } from "@/lib/admin/cron-runs";

/**
 * Computes yesterday's AnalyticsDailyRollup for every company, recomputes
 * the rolling-90-day public response-rate/median-response-time metrics for
 * every company (lib/employer/response-metrics.ts — a full recompute each
 * night is correct for a rolling window, so no separate backfill job runs
 * here), clears expired featured-job placements so the public listing's
 * `featuredUntil desc nulls last` ranking stays correct, and reveals any
 * two-way review whose 14-day double-blind window expired with only one side
 * submitted (see lib/reviews.ts sweepExpiredReviewReveals — idempotent, safe
 * to run more than once a day). Intended to run once daily shortly after
 * midnight UTC.
 *
 * Wrapped in `runTrackedCronJob` (job name "analytics-rollups", matching
 * `.github/workflows/cron-analytics-rollups.yml`) so the `/admin/system`
 * health screen has real run history for this job.
 */
async function runRollups() {
  const result = await runTrackedCronJob("analytics-rollups", async () => {
    const [rollups, responseMetrics, unfeatured, revealedReviews] = await Promise.all([
      runDailyRollupsForAllCompanies(),
      runResponseMetricsForAllCompanies(),
      clearExpiredFeaturedJobs(),
      sweepExpiredReviewReveals(),
    ]);

    return { rollups, responseMetrics, unfeaturedJobs: unfeatured, revealedReviews };
  });

  return NextResponse.json({ ok: true, ...result });
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
