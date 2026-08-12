-- QA assessment: performance indexes + job review rejection reason
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "review_rejection_reason" TEXT;

CREATE INDEX IF NOT EXISTS "jobs_status_idx" ON "jobs"("status");
CREATE INDEX IF NOT EXISTS "jobs_company_id_status_idx" ON "jobs"("company_id", "status");

CREATE INDEX IF NOT EXISTS "companies_verified_status_idx" ON "companies"("verified_status");

CREATE INDEX IF NOT EXISTS "applications_status_idx" ON "applications"("status");
CREATE INDEX IF NOT EXISTS "applications_job_id_status_idx" ON "applications"("job_id", "status");

CREATE INDEX IF NOT EXISTS "notifications_user_id_idx" ON "notifications"("user_id");
CREATE INDEX IF NOT EXISTS "notifications_user_id_read_status_idx" ON "notifications"("user_id", "read_status");

CREATE INDEX IF NOT EXISTS "messages_conversation_id_read_at_idx" ON "messages"("conversation_id", "read_at");

CREATE INDEX IF NOT EXISTS "subscriptions_company_id_idx" ON "subscriptions"("company_id");
CREATE INDEX IF NOT EXISTS "subscriptions_company_id_status_idx" ON "subscriptions"("company_id", "status");
