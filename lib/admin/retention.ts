import { prisma } from "@/lib/prisma";
import {
  listPlatformEventPartitionNames,
  PARTITION_NAME_PATTERN,
  nextMonthFirstDay,
} from "@/lib/admin/partitions";

/**
 * `platform_events` 90-day hot retention — docs/ADMIN-CONSOLE-PLAN.md §7.4 /
 * §8.3. Two-step, strictly ordered, per partition:
 *
 *   1. Aggregate the partition's rows into one `platform_event_daily_rollups`
 *      row per day (event-type counts, actor-type counts — no PII, no user
 *      ids, nothing per-user; see `PARTITION_ROLLUP_QUERY` below) and commit
 *      those rows.
 *   2. Only once step 1 has committed: `DETACH` the partition from
 *      `platform_events` and `DROP` it, in a single transaction.
 *
 * Idempotency / crash safety:
 * - Step 1 is a pure recompute from source data that hasn't been touched
 *   yet, upserted on `platform_event_daily_rollups`'s unique `date`. Re-running
 *   it before the partition is dropped always produces the same numbers, so
 *   a crash before step 2 just means step 1 runs again next time — no lost
 *   data, no double count.
 * - Step 2's DETACH and DROP run inside one `prisma.$transaction`. Postgres
 *   DDL is transactional, so if the process dies mid-transaction the whole
 *   thing rolls back: the partition is still attached, still shows up in
 *   the next run's partition list, and gets retried from step 1 exactly as
 *   if nothing had happened. There is no in-between state where a partition
 *   is detached-but-not-dropped for a later run to trip over.
 * - `platform_events_default` never matches `PARTITION_NAME_PATTERN`
 *   (it has no `_YYYY_MM` suffix), so it can never be selected for
 *   rollup/detach/drop by this job — it is invisible to the logic below by
 *   construction, not by a runtime `if` that could be forgotten.
 */

const HOT_RETENTION_DAYS = 90;

type EventAggRow = { day: string; event_type: string; actor_type: string; cnt: number };

export type DailyEventMetrics = {
  byEventType: Record<string, number>;
  byActorType: Record<string, number>;
};

type EligiblePartition = {
  name: string;
  year: number;
  month: number; // 1-12
  /** Exclusive upper bound of the partition's range, e.g. '2026-10-01'. */
  upperBoundExclusive: string;
};

/**
 * Which existing `platform_events_YYYY_MM` partitions are entirely older
 * than the 90-day cutoff, i.e. every row they could possibly contain has
 * `created_at` before `cutoff`. `platform_events_default` is excluded by
 * construction (see file header). Sorted oldest-first so a run that only
 * gets through some of them (time budget, transient error) always makes
 * progress on the oldest data first.
 */
async function listEligiblePartitions(cutoff: Date): Promise<EligiblePartition[]> {
  const names = await listPlatformEventPartitionNames();
  const eligible: EligiblePartition[] = [];

  for (const name of names) {
    const match = PARTITION_NAME_PATTERN.exec(name);
    if (!match) continue; // excludes platform_events_default and anything unexpected

    const year = Number(match[1]);
    const month = Number(match[2]); // 1-12
    const upperBoundExclusive = nextMonthFirstDay(year, month);

    // Guard: never touch a partition unless it is FULLY older than the
    // cutoff — i.e. its exclusive upper bound is on or before the cutoff,
    // meaning every row it could hold has created_at < cutoff.
    if (new Date(`${upperBoundExclusive}T00:00:00.000Z`) <= cutoff) {
      eligible.push({ name, year, month, upperBoundExclusive });
    }
  }

  eligible.sort((a, b) => a.year - b.year || a.month - b.month);
  return eligible;
}

/**
 * Aggregates one partition's rows into per-day `{ byEventType, byActorType }`
 * counts. Single `GROUP BY` query against the partition — not a per-row loop
 * — so cost scales with the number of distinct (day, event_type, actor_type)
 * combinations in that one month, not with total row count.
 *
 * Counts only. No `user_id`, no `entity_id`, no `metadata` — this is the
 * data that outlives the 90-day hot window, so it must contain no PII
 * whatsoever, per §8.3 of the plan.
 */
async function aggregatePartitionByDay(partitionName: string): Promise<Map<string, DailyEventMetrics>> {
  // $queryRawUnsafe is required — the partition name can't be a bind
  // parameter. `partitionName` is never taken directly from the catalog
  // query without validation: every caller of this function first passes
  // the name through `PARTITION_NAME_PATTERN` in `listEligiblePartitions`,
  // so by the time it reaches here it is guaranteed to match
  // `^platform_events_\d{4}_\d{2}$` — not arbitrary catalog text, and never
  // caller/request-supplied.
  const rows = await prisma.$queryRawUnsafe<EventAggRow[]>(
    `SELECT to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS day,
            event_type,
            actor_type,
            COUNT(*)::int AS cnt
     FROM "${partitionName}"
     GROUP BY 1, 2, 3`
  );

  const byDay = new Map<string, DailyEventMetrics>();
  for (const row of rows) {
    let agg = byDay.get(row.day);
    if (!agg) {
      agg = { byEventType: {}, byActorType: {} };
      byDay.set(row.day, agg);
    }
    agg.byEventType[row.event_type] = (agg.byEventType[row.event_type] ?? 0) + row.cnt;
    agg.byActorType[row.actor_type] = (agg.byActorType[row.actor_type] ?? 0) + row.cnt;
  }
  return byDay;
}

/** Upserts one partition's per-day aggregates into `platform_event_daily_rollups`. */
async function commitPartitionRollups(byDay: Map<string, DailyEventMetrics>): Promise<number> {
  let written = 0;
  for (const [day, metrics] of byDay) {
    await prisma.platformEventDailyRollup.upsert({
      where: { date: new Date(`${day}T00:00:00.000Z`) },
      create: { date: new Date(`${day}T00:00:00.000Z`), metrics },
      update: { metrics },
    });
    written++;
  }
  return written;
}

/** DETACH + DROP in one transaction — see file header for why these are never split across two. */
async function detachAndDropPartition(partitionName: string): Promise<void> {
  await prisma.$transaction([
    prisma.$executeRawUnsafe(
      `ALTER TABLE "platform_events" DETACH PARTITION "${partitionName}"`
    ),
    prisma.$executeRawUnsafe(`DROP TABLE "${partitionName}"`),
  ]);
}

export type PartitionRollupResult = {
  partition: string;
  daysWritten: number;
};

export type RollUpExpiredPartitionsResult = {
  rolledUp: PartitionRollupResult[];
  /** Partitions found eligible but that failed before their rollup rows committed — safe to retry next run. */
  failed: Array<{ partition: string; error: string }>;
};

/**
 * Rolls up and detaches every `platform_events_YYYY_MM` partition that is
 * entirely older than the 90-day hot-retention window, oldest first. See
 * file header for the two-step ordering and crash-safety guarantee.
 */
export async function rollUpExpiredPartitions(
  now: Date = new Date()
): Promise<RollUpExpiredPartitionsResult> {
  const cutoff = new Date(now.getTime() - HOT_RETENTION_DAYS * 24 * 60 * 60 * 1000);
  const eligible = await listEligiblePartitions(cutoff);

  const rolledUp: PartitionRollupResult[] = [];
  const failed: Array<{ partition: string; error: string }> = [];

  for (const partition of eligible) {
    try {
      // Step 1: aggregate + commit rollups (must fully succeed before step 2).
      const byDay = await aggregatePartitionByDay(partition.name);
      const daysWritten = await commitPartitionRollups(byDay);

      // Step 2: only now, detach + drop.
      await detachAndDropPartition(partition.name);

      rolledUp.push({ partition: partition.name, daysWritten });
    } catch (error) {
      // Log and move on to the next partition — a failure here (e.g. mid
      // step 1) leaves the partition untouched and still attached, so the
      // next run picks it back up from listEligiblePartitions() and retries
      // cleanly. Never let one bad partition block the rest of the sweep.
      console.error(`[admin/retention] failed to roll up partition ${partition.name}:`, error);
      failed.push({
        partition: partition.name,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return { rolledUp, failed };
}
