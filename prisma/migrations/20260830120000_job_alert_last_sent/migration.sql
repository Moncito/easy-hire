-- Duplicate-send guard for the job-alert digest cron. Cron systems retry
-- and this endpoint can also be re-run manually, so without a persisted
-- "already sent this window" marker, every retry re-emails the same
-- digest. See lib/seeker/job-alerts-digest.ts (shouldSendJobAlertDigest).

ALTER TABLE "job_alerts" ADD COLUMN IF NOT EXISTS "last_sent_at" TIMESTAMP(3);

-- job_alerts previously had zero indexes despite being queried by
-- `frequency` on every cron run; this also supports the lastSentAt
-- window filter added alongside it.
CREATE INDEX IF NOT EXISTS "job_alerts_frequency_last_sent_at_idx" ON "job_alerts"("frequency", "last_sent_at");
