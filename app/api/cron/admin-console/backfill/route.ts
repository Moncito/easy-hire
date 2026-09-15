import { NextResponse } from "next/server";
import { z } from "zod";
import { computePlatformDailyRollup } from "@/lib/admin/rollups";
import { requireCronAuth } from "@/lib/cron-auth";
import { ApiError, errorResponse } from "@/lib/api-error";

/**
 * POST /api/cron/admin-console/backfill?from=YYYY-MM-DD&to=YYYY-MM-DD
 *
 * One-off reconstruction of `platform_daily_rollups` for dates that already
 * happened. The nightly cron only ever writes yesterday, so without this a
 * brand-new pipeline starts with one data point and gains one per night —
 * which makes every Phase 3 chart unreadable for weeks and, worse, makes an
 * empty chart indistinguishable from a broken query.
 *
 * The history is genuinely recoverable: `computePlatformDailyRollupMetrics`
 * derives almost everything from date-ranged queries over `users`, `jobs`,
 * `applications`, `companies` and `admin_audit_logs`, all of which still hold
 * those rows. It does NOT read `platform_events`, so backfilling works for
 * dates long before the event pipeline existed.
 *
 * WHY AN ENDPOINT AND NOT A SCRIPT. The two existing one-offs in `scripts/`
 * are `.mjs` and talk to Prisma directly; neither can import this project's
 * TypeScript `/lib` modules. A script would therefore have to reimplement the
 * rollup maths, and a second copy of that logic would drift from the real one
 * — at which point the backfilled history and the nightly history stop
 * agreeing and nobody can tell which is right. This route reuses
 * `computePlatformDailyRollup` verbatim.
 *
 * NOT PART OF ANY CRON. Nothing schedules this; it is invoked by hand with
 * the same `CRON_SECRET` the scheduled routes use, and it is safe to re-run —
 * `computePlatformDailyRollup` upserts on the unique `date` column, so a
 * repeated day is overwritten with a freshly recomputed value, never
 * duplicated.
 *
 * TWO THINGS IT DELIBERATELY DOES NOT DO:
 *
 *  - It does not invent `queueDepths`. Those are point-in-time backlog counts
 *    with no historical equivalent, and `computePlatformDailyRollupMetrics`
 *    already returns `null` for them on any date older than yesterday. A
 *    backfilled row therefore says "not known for this day" instead of
 *    stamping today's backlog across three months of flat, fictional history.
 *  - It does not invent `adminReviewLatencyHours` for dates before
 *    `jobs.pending_review_at` existed (migrated 2026-09-10). Those read null
 *    by design — no backfill, no fallback to `createdAt`, which would
 *    silently overstate latency for every pre-migration job.
 */

/** Serverless functions have a wall-clock budget, and each day costs ~13 aggregate queries run sequentially. A month per call keeps a single invocation well inside it; backfilling a quarter means three calls, which is a fair trade for not having a half-written range on a timeout. */
const MAX_BACKFILL_DAYS = 31;

const backfillQuerySchema = z
  .object({
    from: z.coerce.date(),
    to: z.coerce.date(),
  })
  .refine((v) => v.from <= v.to, { message: "`from` must be on or before `to`." });

function utcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function eachUtcDay(from: Date, to: Date): Date[] {
  const days: Date[] = [];
  for (let d = utcDay(from); d.getTime() <= utcDay(to).getTime(); d.setUTCDate(d.getUTCDate() + 1)) {
    days.push(new Date(d));
  }
  return days;
}

export async function POST(req: Request) {
  try {
    requireCronAuth(req);

    const url = new URL(req.url);
    const { from, to } = backfillQuerySchema.parse({
      from: url.searchParams.get("from") ?? undefined,
      to: url.searchParams.get("to") ?? undefined,
    });

    const days = eachUtcDay(from, to);
    if (days.length > MAX_BACKFILL_DAYS) {
      throw new ApiError(
        `Range covers ${days.length} days; the maximum per request is ${MAX_BACKFILL_DAYS}. Split it into smaller ranges — re-running an already-backfilled day is harmless.`,
        400
      );
    }

    // Sequential on purpose. Each day fires ~13 aggregate queries; running a
    // month of them concurrently would spike the Supabase connection pool for
    // no benefit on a job nobody is waiting on interactively. Same reasoning
    // as the bulk moderation path in lib/admin/bulk.ts.
    const results: Array<{ date: string; ok: boolean; error?: string }> = [];
    for (const day of days) {
      const iso = day.toISOString().slice(0, 10);
      try {
        await computePlatformDailyRollup(day);
        results.push({ date: iso, ok: true });
      } catch (error) {
        // One bad day must not abandon the rest of the range half-written.
        // The day is reported and the loop continues; re-running the range
        // later is safe because every write is an upsert.
        console.error(`[cron/admin-console/backfill] ${iso} failed:`, error);
        results.push({ date: iso, ok: false, error: error instanceof Error ? error.message : "Unknown error" });
      }
    }

    const succeeded = results.filter((r) => r.ok).length;

    return NextResponse.json({
      from: days[0]?.toISOString().slice(0, 10) ?? null,
      to: days[days.length - 1]?.toISOString().slice(0, 10) ?? null,
      requested: days.length,
      succeeded,
      failed: days.length - succeeded,
      results,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
