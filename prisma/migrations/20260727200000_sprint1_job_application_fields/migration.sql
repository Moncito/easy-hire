-- Sprint 1: job fields, application ATS fields, indexes, FTS search_vector

ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "requirements" TEXT;
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "benefits" TEXT;
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "published_at" TIMESTAMPTZ;

ALTER TABLE "applications" ADD COLUMN IF NOT EXISTS "internal_notes" TEXT;
ALTER TABLE "applications" ADD COLUMN IF NOT EXISTS "rating" SMALLINT;
ALTER TABLE "applications" ADD COLUMN IF NOT EXISTS "rejection_reason" TEXT;

CREATE INDEX IF NOT EXISTS "applications_job_id_idx" ON "applications"("job_id");
CREATE INDEX IF NOT EXISTS "applications_seeker_id_idx" ON "applications"("seeker_id");
CREATE INDEX IF NOT EXISTS "jobs_company_id_idx" ON "jobs"("company_id");

ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "search_vector" tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce("title", '')), 'A') ||
    setweight(to_tsvector('english', coalesce("description", '')), 'B') ||
    setweight(to_tsvector('english', coalesce("category", '')), 'C') ||
    setweight(to_tsvector('english', coalesce("requirements", '')), 'C') ||
    setweight(to_tsvector('english', coalesce("benefits", '')), 'D')
  ) STORED;

CREATE INDEX IF NOT EXISTS "jobs_search_vector_idx" ON "jobs" USING GIN ("search_vector");
