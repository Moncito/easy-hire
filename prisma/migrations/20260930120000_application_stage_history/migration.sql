-- Structured application stage history.
--
-- Purely additive: two nullable columns and one index on
-- application_activities. Nothing is altered or dropped.
--
-- Until now only the collaborative-hiring path wrote STAGE_CHANGE rows, and
-- only as display text ("APPLIED → INTERVIEW") in `body`. The plain employer
-- flow wrote nothing, so there was no way to tell when an application moved
-- stage, or how far a now-REJECTED application got. The employer dashboard
-- needs both. From this migration on, both paths write from_status and
-- to_status (lib/jobs/stage-history.ts).
--
-- Backfill: existing collaborative STAGE_CHANGE rows are parsed from `body`.
-- Only exact "<STATUS> → <STATUS>" bodies naming valid enum values are
-- converted; anything else stays NULL rather than guessed. Plain-employer
-- history before this migration doesn't exist and can't be recovered, so the
-- dashboard labels stage history with its start date.

SET lock_timeout = '5s';

ALTER TABLE "application_activities"
  ADD COLUMN "from_status" "ApplicationStatus",
  ADD COLUMN "to_status" "ApplicationStatus";

UPDATE "application_activities"
SET
  "from_status" = split_part("body", ' → ', 1)::"ApplicationStatus",
  "to_status"   = split_part("body", ' → ', 2)::"ApplicationStatus"
WHERE "type" = 'STAGE_CHANGE'
  AND "body" ~ '^(APPLIED|SHORTLISTED|INTERVIEW|REJECTED|HIRED) → (APPLIED|SHORTLISTED|INTERVIEW|REJECTED|HIRED)$';

CREATE INDEX "application_activities_to_status_created_at_idx"
  ON "application_activities"("to_status", "created_at");
