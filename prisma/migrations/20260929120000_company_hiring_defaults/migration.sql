-- Company hiring defaults (Settings -> Workspace -> Hiring defaults).
--
-- Purely additive: one new table. Nothing existing is altered, and a company
-- with no row has no defaults, so applying this changes no behaviour.
--
-- One row per company (unique company_id), created the first time the owner
-- saves. Every value is a pre-fill: new jobs copy them at creation, the
-- reject dialog starts from rejection_message, and applicant_note is added to
-- the seeker's "application received" email. Editing a default never touches
-- an existing job or a message already sent.
--
-- screening_questions is a JSON array of { prompt, required }, matching the
-- limits jobs enforce (max 5, 300 chars each). JSON rather than a child
-- table because the template is only ever read and written whole.
--
-- Creating a table and a foreign key to companies takes a SHARE ROW
-- EXCLUSIVE lock on companies. Same fail-fast guard as the ownership
-- transfer migration, which queued behind an idle transaction.

SET lock_timeout = '5s';

CREATE TABLE "company_hiring_defaults" (
  "id"                  TEXT NOT NULL,
  "company_id"          TEXT NOT NULL,
  "category"            TEXT,
  "industry"            TEXT,
  "employment_type"     "EmploymentType",
  "remote_type"         "RemoteType",
  "salary_period"       "SalaryPeriod",
  "location"            TEXT,
  "screening_questions" JSONB NOT NULL DEFAULT '[]',
  "rejection_message"   TEXT,
  "applicant_note"      TEXT,
  "created_at"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"          TIMESTAMP(3) NOT NULL,

  CONSTRAINT "company_hiring_defaults_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "company_hiring_defaults_company_id_key"
  ON "company_hiring_defaults"("company_id");

ALTER TABLE "company_hiring_defaults"
  ADD CONSTRAINT "company_hiring_defaults_company_id_fkey"
  FOREIGN KEY ("company_id") REFERENCES "companies"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
