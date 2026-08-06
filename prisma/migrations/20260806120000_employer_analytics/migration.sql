-- Employer analytics: job views + hire targets
ALTER TABLE "jobs" ADD COLUMN "target_hire_count" INTEGER NOT NULL DEFAULT 1;

CREATE TABLE "job_views" (
    "id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "viewed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "session_hash" TEXT,

    CONSTRAINT "job_views_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "job_views_job_id_viewed_at_idx" ON "job_views"("job_id", "viewed_at");

ALTER TABLE "job_views" ADD CONSTRAINT "job_views_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
