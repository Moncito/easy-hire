-- Employer Pro backend: featured jobs, subscription period end, AI usage,
-- saved talent lists, analytics rollups, export audit log.

-- Featured jobs (Pro only, set via lib/employer/featured.ts)
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "featured_until" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "jobs_featured_until_idx" ON "jobs"("featured_until");

-- Subscription billing period end (persisted from Stripe webhook events)
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "current_period_end" TIMESTAMP(3);

-- Easy AI usage metering
CREATE TABLE IF NOT EXISTS "ai_usage_events" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "feature" TEXT NOT NULL,
    "tokens" INTEGER,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_usage_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ai_usage_events_company_id_idx" ON "ai_usage_events"("company_id");
CREATE INDEX IF NOT EXISTS "ai_usage_events_company_id_feature_idx" ON "ai_usage_events"("company_id", "feature");
CREATE INDEX IF NOT EXISTS "ai_usage_events_company_id_created_at_idx" ON "ai_usage_events"("company_id", "created_at");

ALTER TABLE "ai_usage_events" ADD CONSTRAINT "ai_usage_events_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Saved talent lists (Pro collections; distinct from the simple saved_seekers bookmark)
CREATE TABLE IF NOT EXISTS "saved_talent_lists" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saved_talent_lists_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "saved_talent_lists_company_id_name_key" ON "saved_talent_lists"("company_id", "name");
CREATE INDEX IF NOT EXISTS "saved_talent_lists_company_id_idx" ON "saved_talent_lists"("company_id");

ALTER TABLE "saved_talent_lists" ADD CONSTRAINT "saved_talent_lists_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "saved_talent_list_items" (
    "id" TEXT NOT NULL,
    "list_id" TEXT NOT NULL,
    "seeker_id" TEXT NOT NULL,
    "note" TEXT,
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_talent_list_items_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "saved_talent_list_items_list_id_seeker_id_key" ON "saved_talent_list_items"("list_id", "seeker_id");
CREATE INDEX IF NOT EXISTS "saved_talent_list_items_list_id_idx" ON "saved_talent_list_items"("list_id");
CREATE INDEX IF NOT EXISTS "saved_talent_list_items_seeker_id_idx" ON "saved_talent_list_items"("seeker_id");

ALTER TABLE "saved_talent_list_items" ADD CONSTRAINT "saved_talent_list_items_list_id_fkey" FOREIGN KEY ("list_id") REFERENCES "saved_talent_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "saved_talent_list_items" ADD CONSTRAINT "saved_talent_list_items_seeker_id_fkey" FOREIGN KEY ("seeker_id") REFERENCES "seeker_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Analytics daily rollups (precomputed metrics JSON for fast Pro reports)
CREATE TABLE IF NOT EXISTS "analytics_daily_rollups" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "metrics" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "analytics_daily_rollups_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "analytics_daily_rollups_company_id_date_key" ON "analytics_daily_rollups"("company_id", "date");
CREATE INDEX IF NOT EXISTS "analytics_daily_rollups_company_id_date_idx" ON "analytics_daily_rollups"("company_id", "date");

ALTER TABLE "analytics_daily_rollups" ADD CONSTRAINT "analytics_daily_rollups_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Export audit log — never stores raw exported PII, only who/what/when for compliance
CREATE TABLE IF NOT EXISTS "export_audit_logs" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "meta" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "export_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "export_audit_logs_company_id_idx" ON "export_audit_logs"("company_id");
CREATE INDEX IF NOT EXISTS "export_audit_logs_company_id_created_at_idx" ON "export_audit_logs"("company_id", "created_at");

ALTER TABLE "export_audit_logs" ADD CONSTRAINT "export_audit_logs_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "export_audit_logs" ADD CONSTRAINT "export_audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
