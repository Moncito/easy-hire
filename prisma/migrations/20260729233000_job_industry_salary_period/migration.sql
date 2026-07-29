-- Two-tier job classification (industry) + pay period support

DO $$ BEGIN
  CREATE TYPE "SalaryPeriod" AS ENUM ('HOURLY', 'MONTHLY', 'ANNUAL');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "industry" TEXT;
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "salary_period" "SalaryPeriod" NOT NULL DEFAULT 'MONTHLY';

CREATE INDEX IF NOT EXISTS "jobs_industry_idx" ON "jobs"("industry");
