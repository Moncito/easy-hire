ALTER TABLE "export_audit_logs" ALTER COLUMN "company_id" DROP NOT NULL;
CREATE INDEX IF NOT EXISTS "export_audit_logs_user_id_created_at_idx" ON "export_audit_logs"("user_id", "created_at");
