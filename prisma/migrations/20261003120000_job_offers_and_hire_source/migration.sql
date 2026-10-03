-- Verified hires, Phase 1a (plans/HIRE-REVENUE-PLAN.md §3, approved by the
-- owner 2026-10-03).
--
-- Purely additive: two enums, one table, two nullable columns on
-- applications. Nothing existing is altered or dropped, and no rows are
-- backfilled: hire_source for hires made before this migration is genuinely
-- unknown, so it stays NULL rather than being guessed.
--
-- Same fail-fast lock guard as 20260925130000_company_ownership_transfer.

SET lock_timeout = '5s';

CREATE TYPE "JobOfferStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'WITHDRAWN', 'EXPIRED');
CREATE TYPE "HireSource" AS ENUM ('OFFER_ACCEPTED', 'EMPLOYER_MARKED');

ALTER TABLE "applications"
  ADD COLUMN "hire_source" "HireSource",
  ADD COLUMN "hire_confirmed_by_seeker_at" TIMESTAMP(3);

CREATE TABLE "job_offers" (
  "id"                   TEXT NOT NULL,
  "application_id"       TEXT NOT NULL,
  "company_id"           TEXT NOT NULL,
  "created_by_member_id" TEXT,
  "created_by_user_id"   TEXT NOT NULL,
  "title"                TEXT NOT NULL,
  "monthly_rate_cents"   INTEGER,
  "hourly_rate_cents"    INTEGER,
  "currency"             TEXT NOT NULL DEFAULT 'USD',
  "hours_per_week"       INTEGER,
  "start_date"           DATE,
  "message"              TEXT,
  "status"               "JobOfferStatus" NOT NULL DEFAULT 'PENDING',
  "expires_at"           TIMESTAMP(3) NOT NULL,
  "responded_at"         TIMESTAMP(3),
  "decline_reason"       TEXT,
  "created_at"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"           TIMESTAMP(3) NOT NULL,

  CONSTRAINT "job_offers_pkey" PRIMARY KEY ("id"),
  -- Exactly one way to express pay.
  CONSTRAINT "job_offers_one_rate_check"
    CHECK (("monthly_rate_cents" IS NULL) <> ("hourly_rate_cents" IS NULL))
);

CREATE INDEX "job_offers_application_id_status_idx" ON "job_offers"("application_id", "status");
CREATE INDEX "job_offers_company_id_status_idx" ON "job_offers"("company_id", "status");

-- At most one live offer per application. SQL-only: the Prisma schema
-- cannot express a partial unique index (same precedent as
-- interviews_application_id_scheduled_at_scheduled_key).
CREATE UNIQUE INDEX "job_offers_one_pending_per_application"
  ON "job_offers"("application_id") WHERE "status" = 'PENDING';

ALTER TABLE "job_offers"
  ADD CONSTRAINT "job_offers_application_id_fkey"
  FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "job_offers"
  ADD CONSTRAINT "job_offers_company_id_fkey"
  FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
