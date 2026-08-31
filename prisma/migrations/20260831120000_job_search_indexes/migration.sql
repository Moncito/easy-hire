-- Public job board / sitemap read paths filter and sort on columns that had
-- no index: category, published_at, expires_at. Tables are near-empty
-- pre-launch, so these are cheap to add now and expensive to retrofit later.
--
-- See lib/jobs/public-listing.ts (baseActiveJobWhere / activeJobWhere /
-- buildOrderBy) for the queries these support, and app/sitemap.ts for the
-- published-job listing query.

CREATE INDEX IF NOT EXISTS "jobs_category_idx" ON "jobs"("category");
CREATE INDEX IF NOT EXISTS "jobs_published_at_idx" ON "jobs"("published_at");
CREATE INDEX IF NOT EXISTS "jobs_expires_at_idx" ON "jobs"("expires_at");

-- Composite matching the default public job board listing query in
-- searchPublicJobsPrisma()/listLandingJobs(): filtered by status = 'ACTIVE'
-- and ordered by featured_until DESC NULLS LAST, created_at DESC, id DESC
-- (the id tie-break drives cursor pagination). `status` leads the index
-- because it's the only equality filter on the jobs table itself that every
-- public-board query applies (the other required filter, company
-- verified_status, lives on the joined companies table). The remaining
-- columns mirror the ORDER BY exactly, including NULLS LAST on
-- featured_until, so Postgres can use the index to satisfy the sort instead
-- of doing a separate sort step once the table has real volume.
CREATE INDEX IF NOT EXISTS "jobs_status_featured_until_created_at_id_idx"
  ON "jobs"("status", "featured_until" DESC NULLS LAST, "created_at" DESC, "id" DESC);
