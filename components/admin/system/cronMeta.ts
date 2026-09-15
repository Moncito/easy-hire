/**
 * UI-ONLY display metadata for the four known cron jobs
 * (`lib/admin/cron-runs.ts`'s `KNOWN_CRON_JOB_NAMES`). Labels are text only.
 *
 * `CRON_STALE_AFTER_HOURS` is a presentational heuristic, NOT a value from
 * `/lib` — `lib/admin/system-health.ts`'s `SYSTEM_HEALTH_ALERT_THRESHOLDS`
 * defines exactly three thresholds (DB CPU, pooler clients, Realtime
 * connections) and none of them govern cron staleness. There is no
 * backend-defined "this job's success is too old" threshold to transcribe,
 * so this file derives one directly from each job's own schedule file under
 * `.github/workflows/` rather than inventing an arbitrary single number for
 * every job:
 *   - `admin-console` (`cron-admin-console.yml`, "30 1 * * *") — daily
 *   - `analytics-rollups` (`cron-analytics-rollups.yml`, "0 1 * * *") — daily
 *   - `job-alerts` (`cron-job-alerts-daily.yml`, "0 13 * * *", plus a weekly
 *     variant under the same tracked job name) — daily
 *   - `ai-digest` (`cron-ai-digest.yml`, "0 14 * * 1") — weekly (Monday only)
 * Each threshold is roughly 1.5x the expected interval, so a single normal
 * scheduling delay does not falsely trip the warning, but a genuinely missed
 * run does. This is a UI judgment call, called out here so it is never
 * mistaken for a value the backend asserts.
 */

export const CRON_JOB_LABELS: Record<string, string> = {
  "admin-console": "Admin console — partition pre-creation & rollups",
  "ai-digest": "AI weekly digest",
  "analytics-rollups": "Analytics rollups",
  "job-alerts": "Job alerts",
};

export const CRON_STALE_AFTER_HOURS: Record<string, number> = {
  "admin-console": 36,
  "analytics-rollups": 36,
  "job-alerts": 36,
  "ai-digest": 216, // 9 days — this job is scheduled weekly, not daily
};

export const DEFAULT_CRON_STALE_AFTER_HOURS = 36;

export function staleAfterHoursFor(jobName: string): number {
  return CRON_STALE_AFTER_HOURS[jobName] ?? DEFAULT_CRON_STALE_AFTER_HOURS;
}
