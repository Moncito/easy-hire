import { prisma } from "@/lib/prisma";

/**
 * `platform_events` monthly partition maintenance —
 * docs/ADMIN-CONSOLE-PLAN.md §7.4, and the long hazard comment above
 * `platform_events_default` in
 * prisma/migrations/20260909120000_admin_console_phase0/migration.sql.
 *
 * ⚠ WHY THIS JOB EXISTS (read this before touching it)
 * `platform_events` is RANGE partitioned monthly on `created_at`, with
 * partitions hand-authored only through 2026-12 plus a `DEFAULT` catch-all.
 * From 2027-01-01 onward, any write whose `created_at` doesn't fall in an
 * existing partition's range lands in `DEFAULT`. That's fine right up until
 * someone tries to create the partition that range actually belongs to:
 * adding a new partition forces Postgres to scan `DEFAULT` under an ACCESS
 * EXCLUSIVE lock to prove no existing row belongs in the incoming range, and
 * `CREATE TABLE ... PARTITION OF` FAILS OUTRIGHT if it finds even one row
 * that does. So the safety net actively blocks the rollout precisely when
 * it has caught something.
 *
 * This job running on schedule (see app/api/cron/admin-console/route.ts,
 * which runs it FIRST, before anything else touches platform_events) is
 * what keeps `DEFAULT` permanently empty. An empty `DEFAULT` is, in turn,
 * exactly what keeps every future month's partition creatable. Running this
 * several months ahead of the current month (the `monthsAhead` default) is
 * the margin that covers a missed cron run or two without ever letting a
 * write actually reach `DEFAULT`.
 */

const PARTITION_NAME_PATTERN = /^platform_events_(\d{4})_(\d{2})$/;

/**
 * Existing monthly partitions of `platform_events`, read from Postgres'
 * catalog (`pg_inherits`/`pg_class`) rather than assumed — this is what lets
 * `ensureFuturePartitions` be a true no-op when nothing is missing. Includes
 * `platform_events_default`; callers must filter it out (see
 * `PARTITION_NAME_PATTERN`, which `platform_events_default` never matches).
 */
async function listPlatformEventPartitionNames(): Promise<Set<string>> {
  const rows = await prisma.$queryRaw<{ relname: string }[]>`
    SELECT child.relname
    FROM pg_inherits
    JOIN pg_class parent ON pg_inherits.inhparent = parent.oid
    JOIN pg_class child ON pg_inherits.inhrelid = child.oid
    JOIN pg_namespace ns ON parent.relnamespace = ns.oid
    WHERE parent.relname = 'platform_events'
      AND ns.nspname = 'public'
  `;
  return new Set(rows.map((r) => r.relname));
}

function zeroPad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** First day of the month AFTER (year, month) [month is 1-12], as 'YYYY-MM-01'. */
function nextMonthFirstDay(year: number, month: number): string {
  // Date.UTC's month argument is 0-based, so passing the 1-based `month`
  // straight through lands one month ahead — exactly the "next month" we
  // want, with correct year rollover (December -> January) handled by Date
  // itself.
  const next = new Date(Date.UTC(year, month, 1));
  return `${next.getUTCFullYear()}-${zeroPad2(next.getUTCMonth() + 1)}-01`;
}

/**
 * Ensures a monthly partition exists for the current month and every month
 * up to `monthsAhead` out (default 3), creating any that are missing.
 * Idempotent: partitions that already exist are left untouched (and are
 * never recreated — `CREATE TABLE IF NOT EXISTS` is belt-and-suspenders on
 * top of the pre-check against the catalog, not a substitute for it, so a
 * second run in the same month does nothing).
 *
 * Returns the partitions it actually created, so the cron response can
 * report whether this run did real work or found everything already in
 * place.
 */
export async function ensureFuturePartitions(
  monthsAhead = 3
): Promise<{ created: string[] }> {
  const now = new Date();
  const startYear = now.getUTCFullYear();
  const startMonth = now.getUTCMonth() + 1; // 1-12

  // Current month through `monthsAhead` months out, inclusive.
  const targets: Array<{ year: number; month: number }> = [];
  for (let i = 0; i <= monthsAhead; i++) {
    const totalMonths = startMonth - 1 + i; // 0-based running month count
    const year = startYear + Math.floor(totalMonths / 12);
    const month = (totalMonths % 12) + 1; // back to 1-based
    targets.push({ year, month });
  }

  const existing = await listPlatformEventPartitionNames();
  const created: string[] = [];

  for (const { year, month } of targets) {
    const mm = zeroPad2(month);
    const partitionName = `platform_events_${year}_${mm}`;
    if (existing.has(partitionName)) continue;

    const fromDate = `${year}-${mm}-01`;
    const toDate = nextMonthFirstDay(year, month);

    // $executeRawUnsafe is required here — not $executeRaw with a bind
    // parameter — because a partition/table name can never be a bind
    // parameter in Postgres DDL. The identifier interpolated below is built
    // ENTIRELY from `year`/`month`, which come only from the server clock
    // (`now`) above — never from a caller, request body, query string, or
    // any other external input. Nobody should later read this and assume
    // it's a place where user-controlled data flows into SQL; it isn't, and
    // it must never become one.
    await prisma.$executeRawUnsafe(
      `CREATE TABLE IF NOT EXISTS "${partitionName}" PARTITION OF "platform_events" FOR VALUES FROM ('${fromDate}') TO ('${toDate}')`
    );
    created.push(partitionName);
  }

  return { created };
}

// Exported for lib/admin/retention.ts, which needs the same "what
// partitions actually exist" read but filtered/parsed differently (it cares
// about age, not presence). Keeping the catalog query in one place means
// both jobs agree on how a partition name maps to its date range.
export { listPlatformEventPartitionNames, PARTITION_NAME_PATTERN, nextMonthFirstDay, zeroPad2 };
