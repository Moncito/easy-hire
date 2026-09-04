-- Phase 4.3: public "response rate / median response time" metrics.
-- See prisma/schema.prisma's Application.firstEmployerResponseAt and Company
-- response-metrics field comments for the design notes this migration
-- implements. lib/employer/response-metrics.ts is the read/write side.

-- AlterTable: stamp-once "first employer engagement" anchor, same precedent
-- as Application.hired_at. `updated_at` can't serve this (it also advances on
-- internal notes/ratings) and ApplicationActivity only covers the
-- collaborative-hiring path, not the plain employer flow.
ALTER TABLE "applications" ADD COLUMN "first_employer_response_at" TIMESTAMP(3);

-- ============================================================================
-- BACKFILL — earliest available evidence per application, in priority order.
-- Every step only ever touches rows still NULL, so later steps can't clobber
-- an earlier (better) answer, and running any step twice is a no-op.
-- ============================================================================

-- 1) Collaborative-hiring workspace: earliest STAGE_CHANGE activity row.
UPDATE "applications" a
SET "first_employer_response_at" = sub.min_created_at
FROM (
  SELECT "application_id", MIN("created_at") AS min_created_at
  FROM "application_activities"
  WHERE "type" = 'STAGE_CHANGE'
  GROUP BY "application_id"
) sub
WHERE a."id" = sub."application_id"
  AND a."first_employer_response_at" IS NULL;

-- 2a) Messages — job-scoped conversation (conversations.job_id IS NOT NULL).
-- Conversation is unique on (company_id, seeker_id) — a seeker has at most
-- one conversation per company regardless of how many jobs they applied to
-- there — so when that single conversation *is* scoped to a job, it
-- unambiguously answers "which application is this thread about," and we
-- stamp that exact (job_id, seeker_id) application from the company owner's
-- earliest message in it.
UPDATE "applications" a
SET "first_employer_response_at" = sub.min_created_at
FROM (
  SELECT c."job_id" AS job_id, c."seeker_id" AS seeker_id, MIN(m."created_at") AS min_created_at
  FROM "conversations" c
  JOIN "companies" co ON co."id" = c."company_id"
  JOIN "messages" m ON m."conversation_id" = c."id" AND m."sender_user_id" = co."user_id"
  WHERE c."job_id" IS NOT NULL
  GROUP BY c."job_id", c."seeker_id"
) sub
WHERE a."job_id" = sub.job_id
  AND a."seeker_id" = sub.seeker_id
  AND a."first_employer_response_at" IS NULL;

-- 2b) Messages — company-wide conversation (conversations.job_id IS NULL).
-- Mirrors the runtime rule in lib/messaging/messages.ts's sendMessage: a
-- thread with no job attached can't be tied to one application by evidence,
-- so we stamp only the seeker's most-recently-applied, still-unstamped
-- application at that company — the same "best available guess" the live
-- stamping code makes. The applied_at = MAX(...) correlated filter re-picks
-- the current max among rows still NULL after step 1 and 2a, so an
-- already-stamped later application never blocks an earlier one from
-- picking up this evidence.
UPDATE "applications" a
SET "first_employer_response_at" = sub.min_created_at
FROM (
  SELECT c."company_id" AS company_id, c."seeker_id" AS seeker_id, MIN(m."created_at") AS min_created_at
  FROM "conversations" c
  JOIN "companies" co ON co."id" = c."company_id"
  JOIN "messages" m ON m."conversation_id" = c."id" AND m."sender_user_id" = co."user_id"
  WHERE c."job_id" IS NULL
  GROUP BY c."company_id", c."seeker_id"
) sub
WHERE a."seeker_id" = sub.seeker_id
  AND a."first_employer_response_at" IS NULL
  AND a."job_id" IN (SELECT j."id" FROM "jobs" j WHERE j."company_id" = sub.company_id)
  AND a."applied_at" = (
    SELECT MAX(a2."applied_at")
    FROM "applications" a2
    JOIN "jobs" j2 ON j2."id" = a2."job_id"
    WHERE j2."company_id" = sub.company_id
      AND a2."seeker_id" = sub.seeker_id
      AND a2."first_employer_response_at" IS NULL
  );

-- 3) No activity/message evidence at all, but the application has already
-- moved off APPLIED (set via some pre-migration path, e.g. direct DB
-- editing or a status change made before this column existed) — fall back to
-- updated_at as the least-bad available timestamp. Applications still
-- APPLIED are left NULL: that is a genuine, ungamed non-response.
UPDATE "applications"
SET "first_employer_response_at" = "updated_at"
WHERE "status" <> 'APPLIED' AND "first_employer_response_at" IS NULL;

-- CreateIndex: supports recomputeCompanyResponseMetrics's per-company load
-- (lib/employer/response-metrics.ts) — "for each of a company's job ids,
-- applications whose applied_at falls in the rolling 90-day window."
-- applied_at (not first_employer_response_at) is the second key because the
-- WHERE clause filters on the window bound; first_employer_response_at is
-- only ever read per row, never filtered in SQL (the grace-period/qualifying
-- decision runs in computeResponseMetrics, in JS).
CREATE INDEX "applications_job_id_applied_at_idx" ON "applications"("job_id", "applied_at");

-- AlterTable: denormalized public rollup, recomputed nightly by
-- runResponseMetricsForAllCompanies. Nulls out (not zero) until
-- response_sample_size clears computeResponseMetrics's minimum-sample gate.
ALTER TABLE "companies"
  ADD COLUMN "response_rate" INTEGER,
  ADD COLUMN "median_response_minutes" INTEGER,
  ADD COLUMN "response_sample_size" INTEGER,
  ADD COLUMN "response_metrics_updated_at" TIMESTAMP(3);
