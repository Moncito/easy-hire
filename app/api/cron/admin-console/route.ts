import { NextResponse } from "next/server";
import { ensureFuturePartitions } from "@/lib/admin/partitions";
import { runPlatformRollupForYesterday } from "@/lib/admin/rollups";
import { recomputeTrustScores } from "@/lib/admin/trust";
import { rollUpExpiredPartitions } from "@/lib/admin/retention";
import { requireCronAuth } from "@/lib/cron-auth";
import { errorResponse } from "@/lib/api-error";

/** Trust scores are recomputed for accounts active in this trailing window (docs/ADMIN-CONSOLE-PLAN.md §7.3: "activity in the last 24h"). */
const TRUST_SCORE_LOOKBACK_HOURS = 24;

/**
 * Admin console event-pipeline maintenance — docs/ADMIN-CONSOLE-PLAN.md
 * §7.4/§10. Runs four steps, IN THIS ORDER, and the order is load-bearing:
 *
 *   1. `ensureFuturePartitions()` — FIRST, always. Guarantees a partition
 *      exists for the current month and several months out before anything
 *      else in this run (or any concurrent write elsewhere in the app) can
 *      possibly need one. See lib/admin/partitions.ts's file header for why
 *      an empty `platform_events_default` depends on this running regularly.
 *   2. `computePlatformDailyRollup` for yesterday — reads live tables
 *      (users/jobs/applications/companies/...) plus whatever of yesterday's
 *      `platform_events` partition still exists.
 *   3. `recomputeTrustScores` — AFTER the rollup, BEFORE retention. Reads
 *      `platform_events` (still fully hot at this point — nothing has been
 *      rolled up/detached yet) to find accounts active in the trailing
 *      `TRUST_SCORE_LOOKBACK_HOURS`, then batched-reads applications/
 *      reviews/abuse reports/admin audit log to score them. Runs before
 *      retention for the same reason the rollup does: neither should ever
 *      be delayed by a slow retention sweep.
 *   4. `rollUpExpiredPartitions()` — LAST, on purpose. It only touches
 *      partitions entirely older than the 90-day hot window, so it can
 *      never race steps 2/3 (which read yesterday/last-24h, i.e. inside the
 *      hot window) — but keeping it last regardless means a slow or
 *      partially-failed retention sweep can never delay partition
 *      provisioning, the daily rollup, or trust scoring, which every other
 *      part of the admin console depends on being fresh.
 *
 * Intended to run once daily. Auth/error handling mirrors
 * app/api/cron/analytics-rollups/route.ts exactly.
 */
async function runAdminConsoleMaintenance() {
  const partitions = await ensureFuturePartitions();
  const rollup = await runPlatformRollupForYesterday();
  const trust = await recomputeTrustScores({
    since: new Date(Date.now() - TRUST_SCORE_LOOKBACK_HOURS * 60 * 60 * 1000),
  });
  const retention = await rollUpExpiredPartitions();

  return NextResponse.json({
    ok: true,
    partitions,
    rollup,
    trust,
    retention,
  });
}

/** GET /api/cron/admin-console — invoked by Vercel Cron. */
export async function GET(req: Request) {
  try {
    requireCronAuth(req);
    return await runAdminConsoleMaintenance();
  } catch (error) {
    return errorResponse(error);
  }
}

/** POST /api/cron/admin-console — same as GET, kept for manual triggering. */
export async function POST(req: Request) {
  try {
    requireCronAuth(req);
    return await runAdminConsoleMaintenance();
  } catch (error) {
    return errorResponse(error);
  }
}
