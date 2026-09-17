import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Cron run history + health for the `/admin/system` health screen —
 * docs/ADMIN-CONSOLE-PLAN.md §4.10 ("cron run history and last-success
 * age") and docs/build-plan.md's Sprint 11 entry for `cron_runs`.
 * ============================================================================
 * Nothing recorded this before this module existed: `vercel.json` declares
 * no `crons` array (Vercel Hobby caps a project at 2, and this app needs
 * four), so all four scheduled jobs run as GitHub Actions workflows that
 * `curl` the route over HTTPS. The app has no other way to learn a job ran,
 * or that it failed, than the route itself writing a row here at start and
 * at finish — see the `CronRun` model's own doc comment in
 * prisma/schema.prisma.
 *
 * KNOWN JOBS. `KNOWN_CRON_JOB_NAMES` below is deliberately the FOUR
 * *scheduled* jobs — `admin-console`, `ai-digest`, `analytics-rollups`,
 * `job-alerts` — one per `.github/workflows/cron-*.yml` file (the two
 * job-alerts workflows, daily and weekly, both invoke the same route with a
 * different `?frequency=` query param and are tracked under the ONE
 * `job-alerts` job name, per the task spec). `admin-console/backfill` is
 * NOT a known job and is NEVER wired to `runTrackedCronJob` — it is a
 * manually-invoked one-off (see its own route doc comment), and recording it
 * here would pollute `getCronHealth`'s last-success-age signal with runs
 * that were never supposed to happen on a schedule in the first place.
 *
 * RELIABILITY CONTRACT — the opposite of `recordAdminAction`'s. A cron job
 * that otherwise ran correctly must never be made to fail, or look like it
 * failed, because the health-tracking INSERT/UPDATE itself had a problem
 * (e.g. a transient DB blip at the exact moment the row is written). Every
 * write in this module that a cron route touches through `runTrackedCronJob`
 * is therefore wrapped in its own try/catch that logs and swallows — see
 * `runTrackedCronJob` below, which is what every `app/api/cron/*` route
 * (other than the backfill route) actually calls.
 */

export const KNOWN_CRON_JOB_NAMES = ["admin-console", "ai-digest", "analytics-rollups", "job-alerts"] as const;

export type KnownCronJobName = (typeof KNOWN_CRON_JOB_NAMES)[number];

export type CronRunStatus = "RUNNING" | "SUCCESS" | "FAILED";

// ============================================================================
// Write path
// ============================================================================

/** Inserts a `RUNNING` row and returns its id. Callers that want the resilient, never-fails-the-job behaviour should use `runTrackedCronJob` instead of calling this directly. */
export async function startCronRun(jobName: string): Promise<string> {
  const row = await prisma.cronRun.create({ data: { jobName, status: "RUNNING" } });
  return row.id;
}

/** Marks a previously-started run finished. `detail` is an arbitrary JSON summary of what the job did (e.g. counts); `error` is the failure message on a FAILED outcome. Both are optional and independent — a SUCCESS can still carry `detail`, and (in principle) either could be omitted. */
export async function finishCronRun(
  id: string,
  status: Extract<CronRunStatus, "SUCCESS" | "FAILED">,
  opts?: { detail?: Prisma.InputJsonValue; error?: string }
): Promise<void> {
  await prisma.cronRun.update({
    where: { id },
    data: {
      finishedAt: new Date(),
      status,
      ...(opts?.detail !== undefined ? { detail: opts.detail } : {}),
      ...(opts?.error !== undefined ? { error: opts.error } : {}),
    },
  });
}

async function startCronRunSafe(jobName: string): Promise<string | null> {
  try {
    return await startCronRun(jobName);
  } catch (error) {
    console.error(`[cron-runs] failed to record the start of "${jobName}" — continuing without a tracked run id:`, error);
    return null;
  }
}

async function finishCronRunSafe(
  id: string | null,
  status: Extract<CronRunStatus, "SUCCESS" | "FAILED">,
  opts?: { detail?: Prisma.InputJsonValue; error?: string }
): Promise<void> {
  if (!id) return;
  try {
    await finishCronRun(id, status, opts);
  } catch (error) {
    console.error(`[cron-runs] failed to record ${status} for run ${id}:`, error);
  }
}

/**
 * Wraps a scheduled job's actual work with start/finish tracking. This is
 * what every `app/api/cron/*` route (other than the manually-invoked
 * `admin-console/backfill`) calls — it is the one place the
 * "try/catch/finally, and a broken insert must not fail an otherwise-good
 * job" contract lives, so no route re-implements it.
 *
 * - Start and finish writes are individually swallowed-and-logged (never
 *   thrown) — see `startCronRunSafe`/`finishCronRunSafe` above. A cron whose
 *   `cron_runs` write fails still runs, and still returns its real result to
 *   the caller.
 * - `fn`'s own error is ALWAYS rethrown after the FAILED row is (attempted
 *   to be) recorded, in the `finally` block below — so a job that throws
 *   is recorded as FAILED rather than being left `RUNNING` forever (a crash
 *   between start and a would-be finish is exactly the case a bare
 *   try/finally with no catch would still leave dangling; this uses an
 *   explicit try/catch/finally so the FAILED write happens deterministically
 *   on the way out, before the original error propagates).
 * - `opts.detail`, if given, is computed from the job's own successful
 *   result and stored as SUCCESS's `detail` — e.g. the job-alerts route
 *   records which `frequency` it ran, since one `job-alerts` cron_runs row
 *   otherwise can't tell a daily run from a weekly one.
 */
export async function runTrackedCronJob<T>(
  jobName: KnownCronJobName,
  fn: () => Promise<T>,
  opts?: { detail?: (result: T) => Prisma.InputJsonValue }
): Promise<T> {
  const runId = await startCronRunSafe(jobName);

  let outcome: { ok: true; result: T } | { ok: false; error: unknown } | undefined;
  try {
    const result = await fn();
    outcome = { ok: true, result };
    return result;
  } catch (error) {
    outcome = { ok: false, error };
    throw error;
  } finally {
    if (outcome?.ok) {
      await finishCronRunSafe(runId, "SUCCESS", {
        detail: opts?.detail ? opts.detail(outcome.result) : undefined,
      });
    } else if (outcome && !outcome.ok) {
      await finishCronRunSafe(runId, "FAILED", {
        error: outcome.error instanceof Error ? outcome.error.message : String(outcome.error),
      });
    }
  }
}

// ============================================================================
// Read path — recent run history, bounded and cursor-paginated (§10: never an
// unbounded read), same (createdAt-like, id) cursor convention as
// lib/admin/audit.ts's listAuditLog.
// ============================================================================

export type CronRunCursor = { startedAt: Date; id: string };

const DEFAULT_RECENT_CRON_RUNS_LIMIT = 50;
const MAX_RECENT_CRON_RUNS_LIMIT = 200;

export async function listRecentCronRuns(opts?: { jobName?: string; cursor?: CronRunCursor; limit?: number }) {
  const limit = Math.min(Math.max(opts?.limit ?? DEFAULT_RECENT_CRON_RUNS_LIMIT, 1), MAX_RECENT_CRON_RUNS_LIMIT);

  const rows = await prisma.cronRun.findMany({
    where: {
      ...(opts?.jobName ? { jobName: opts.jobName } : {}),
      ...(opts?.cursor
        ? {
            OR: [
              { startedAt: { lt: opts.cursor.startedAt } },
              { startedAt: opts.cursor.startedAt, id: { lt: opts.cursor.id } },
            ],
          }
        : {}),
    },
    orderBy: [{ startedAt: "desc" }, { id: "desc" }],
    take: limit + 1,
  });

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const last = page[page.length - 1];

  return {
    runs: page,
    nextCursor: hasMore && last ? { startedAt: last.startedAt, id: last.id } : null,
  };
}

// ============================================================================
// getCronHealth — per known job name: last run, last SUCCESS, age of last
// success, current status. TWO batched queries total (one for "last run per
// job", one for "last SUCCESS per job"), never one query per job name.
// ============================================================================

export type CronRunSummary = {
  id: string;
  startedAt: Date;
  finishedAt: Date | null;
  status: string;
  error: string | null;
};

export type CronHealthEntry = {
  jobName: KnownCronJobName;
  lastRun: CronRunSummary | null;
  lastSuccessAt: Date | null;
  /** Hours since `lastSuccessAt`, or `null` if this job has never recorded a SUCCESS. */
  lastSuccessAgeHours: number | null;
  /** `"NEVER_RUN"` when `lastRun` is null; otherwise `lastRun.status` verbatim. */
  currentStatus: "NEVER_RUN" | CronRunStatus;
};

/**
 * Pure — no DB access, cheap to unit test (same convention as
 * `computeAgeHours`/`computeSlaBand` in lib/admin/queues.ts). Takes the two
 * batched lookups' per-job results as plain inputs.
 */
export function computeCronHealthEntry(
  jobName: KnownCronJobName,
  lastRun: CronRunSummary | null,
  lastSuccess: CronRunSummary | null,
  now: Date
): CronHealthEntry {
  const lastSuccessAt = lastSuccess ? (lastSuccess.finishedAt ?? lastSuccess.startedAt) : null;
  const lastSuccessAgeHours = lastSuccessAt ? (now.getTime() - lastSuccessAt.getTime()) / (1000 * 60 * 60) : null;
  const currentStatus: CronHealthEntry["currentStatus"] = lastRun ? (lastRun.status as CronRunStatus) : "NEVER_RUN";

  return { jobName, lastRun, lastSuccessAt, lastSuccessAgeHours, currentStatus };
}

type RawCronRunRow = {
  job_name: string;
  id: string;
  started_at: Date;
  finished_at: Date | null;
  status: string;
  error: string | null;
};

function toSummary(row: RawCronRunRow): CronRunSummary {
  return { id: row.id, startedAt: row.started_at, finishedAt: row.finished_at, status: row.status, error: row.error };
}

/**
 * Uses `DISTINCT ON` raw SQL, same precedent as
 * `batchCategorySalaryStats` in lib/admin/queues.ts, because Prisma's
 * `groupBy` can only return aggregates (max/min/count), never "the whole
 * latest row per group" — and that whole row (status, finishedAt, error) is
 * exactly what a health screen needs to show, not just a timestamp.
 */
export async function getCronHealth(): Promise<CronHealthEntry[]> {
  const now = new Date();
  const jobNames = [...KNOWN_CRON_JOB_NAMES];

  const [lastRunRows, lastSuccessRows] = await Promise.all([
    prisma.$queryRaw<RawCronRunRow[]>`
      SELECT DISTINCT ON (job_name) job_name, id, started_at, finished_at, status, error
      FROM cron_runs
      WHERE job_name = ANY(${jobNames})
      ORDER BY job_name, started_at DESC
    `,
    prisma.$queryRaw<RawCronRunRow[]>`
      SELECT DISTINCT ON (job_name) job_name, id, started_at, finished_at, status, error
      FROM cron_runs
      WHERE job_name = ANY(${jobNames}) AND status = 'SUCCESS'
      ORDER BY job_name, started_at DESC
    `,
  ]);

  const lastRunByJob = new Map(lastRunRows.map((row) => [row.job_name, toSummary(row)]));
  const lastSuccessByJob = new Map(lastSuccessRows.map((row) => [row.job_name, toSummary(row)]));

  return jobNames.map((jobName) =>
    computeCronHealthEntry(jobName, lastRunByJob.get(jobName) ?? null, lastSuccessByJob.get(jobName) ?? null, now)
  );
}
