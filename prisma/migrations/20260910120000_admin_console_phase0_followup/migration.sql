-- Admin console Phase 0 follow-up (docs/build-plan.md "Sprint 10b — approved
-- (admin console Phase 0 follow-up, 2026-09-10)"). Both gaps were found by
-- the Phase 0 rollup job (lib/admin/rollups.ts), not predicted in advance.
--
-- This migration is purely additive: one new nullable column and five new
-- indexes. It does not alter or drop any existing table, column, index, or
-- constraint.
--
-- 1. jobs.pending_review_at — "Admin review latency" is listed in
--    build-plan.md's own metrics table ("Employer churn risk") but was not
--    computable: `Job` records the decision (status/publishedAt/
--    reviewRejectionReason) but never the submission, and no status-history
--    table exists. This column is stamped by lib/jobs/crud.ts every time a
--    job enters PENDING_REVIEW (create-and-submit, and ACTIVE-job
--    edit-and-resubmit) — see the field's schema comment for why it
--    RESTAMPS on every entry rather than stamping once. Existing rows get
--    NULL, which lib/admin/rollups.ts's new metric reads as "not
--    computable for this job," not zero — no backfill, no invented
--    fallback.
--
-- 2. Five indexes on plain date columns that back nightly rollup date-range
--    COUNTs (lib/admin/rollups.ts): users.created_at (signups/day),
--    companies.created_at (new companies/day), jobs.created_at (jobs
--    created/day — `Job` already indexes published_at, not created_at),
--    applications.applied_at (applications submitted/day), and
--    applications.hired_at (hires/day, time-to-hire). Every existing
--    `Application` index is led by job_id, so a same-day date-range count on
--    either column was a sequential scan before these. Fine at current row
--    counts; degrades silently inside a nightly job nobody watches as the
--    tables grow.

-- AlterTable
ALTER TABLE "jobs" ADD COLUMN "pending_review_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "jobs_created_at_idx" ON "jobs"("created_at");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "users_created_at_idx" ON "users"("created_at");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "companies_created_at_idx" ON "companies"("created_at");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "applications_applied_at_idx" ON "applications"("applied_at");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "applications_hired_at_idx" ON "applications"("hired_at");
