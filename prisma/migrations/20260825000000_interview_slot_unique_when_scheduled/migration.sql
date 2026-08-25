-- Prevent duplicate interviews for the same candidate application at the same
-- exact scheduled time. The app-level pre-check in scheduleInterview()
-- (lib/collaborative-interviews.ts) is not sufficient under concurrent
-- requests (double-clicks / retried requests), so this partial unique index
-- is the authoritative guarantee at the database level.
--
-- Scoped to status = 'SCHEDULED' only, so a CANCELLED interview does not
-- block re-scheduling a new interview for the same application/time.
CREATE UNIQUE INDEX "interviews_application_id_scheduled_at_scheduled_key"
  ON "interviews"("application_id", "scheduled_at")
  WHERE "status" = 'SCHEDULED';
