import { describe, expect, it } from "vitest";
import { computeCronHealthEntry, KNOWN_CRON_JOB_NAMES, type CronRunSummary } from "@/lib/admin/cron-runs";

/**
 * Guards `computeCronHealthEntry` — the pure predicate behind
 * `getCronHealth`'s per-job health tile. This is the function that decides
 * whether the `/admin/system` screen reports a job as never run, currently
 * running, healthy, or failed, and how stale its last success is — getting
 * any branch wrong understates or overstates operational risk to whoever is
 * reading the health screen.
 */

const NOW = new Date("2026-09-15T12:00:00.000Z");

function run(overrides: Partial<CronRunSummary>): CronRunSummary {
  return {
    id: "run-1",
    startedAt: new Date("2026-09-15T01:00:00.000Z"),
    finishedAt: new Date("2026-09-15T01:05:00.000Z"),
    status: "SUCCESS",
    error: null,
    ...overrides,
  };
}

describe("computeCronHealthEntry", () => {
  it("reports NEVER_RUN with null lastSuccessAt/lastSuccessAgeHours when the job has no rows at all", () => {
    const entry = computeCronHealthEntry("ai-digest", null, null, NOW);

    expect(entry.currentStatus).toBe("NEVER_RUN");
    expect(entry.lastRun).toBeNull();
    expect(entry.lastSuccessAt).toBeNull();
    expect(entry.lastSuccessAgeHours).toBeNull();
  });

  it("currentStatus mirrors the last run's status verbatim when a last run exists", () => {
    const lastRun = run({ status: "RUNNING", finishedAt: null });
    const entry = computeCronHealthEntry("admin-console", lastRun, null, NOW);

    expect(entry.currentStatus).toBe("RUNNING");
    expect(entry.lastRun).toBe(lastRun);
  });

  it("currentStatus is FAILED when the most recent run failed, even if an earlier success exists", () => {
    const lastRun = run({ id: "run-2", status: "FAILED", finishedAt: new Date("2026-09-15T11:00:00.000Z"), error: "boom" });
    const lastSuccess = run({ id: "run-1", status: "SUCCESS", finishedAt: new Date("2026-09-14T01:05:00.000Z") });

    const entry = computeCronHealthEntry("analytics-rollups", lastRun, lastSuccess, NOW);

    expect(entry.currentStatus).toBe("FAILED");
    expect(entry.lastSuccessAt).toEqual(lastSuccess.finishedAt);
  });

  it("lastSuccessAgeHours is computed from finishedAt when present", () => {
    const lastSuccess = run({ finishedAt: new Date("2026-09-15T06:00:00.000Z") });
    const entry = computeCronHealthEntry("job-alerts", lastSuccess, lastSuccess, NOW);

    expect(entry.lastSuccessAgeHours).toBe(6);
  });

  it("falls back to startedAt for lastSuccessAgeHours when a success row has no finishedAt (defensive — finishCronRun always sets it in practice)", () => {
    const lastSuccess = run({ startedAt: new Date("2026-09-15T09:00:00.000Z"), finishedAt: null });
    const entry = computeCronHealthEntry("job-alerts", lastSuccess, lastSuccess, NOW);

    expect(entry.lastSuccessAgeHours).toBe(3);
  });

  it("reports a large age for a long-stale success, never fabricating recency", () => {
    const lastSuccess = run({ finishedAt: new Date("2026-09-10T12:00:00.000Z") });
    const entry = computeCronHealthEntry("admin-console", lastSuccess, lastSuccess, NOW);

    expect(entry.lastSuccessAgeHours).toBe(5 * 24);
  });

  it("carries the jobName through unchanged for every known job", () => {
    for (const jobName of KNOWN_CRON_JOB_NAMES) {
      const entry = computeCronHealthEntry(jobName, null, null, NOW);
      expect(entry.jobName).toBe(jobName);
    }
  });

  it("KNOWN_CRON_JOB_NAMES excludes the manually-invoked backfill route — only the four scheduled jobs", () => {
    expect(KNOWN_CRON_JOB_NAMES).toEqual(["admin-console", "ai-digest", "analytics-rollups", "job-alerts"]);
    expect(KNOWN_CRON_JOB_NAMES as readonly string[]).not.toContain("admin-console/backfill");
  });
});
