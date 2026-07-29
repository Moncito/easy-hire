-- AlterTable
ALTER TABLE "seeker_profiles"
ADD COLUMN "work_experience" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "education" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "resume_label" TEXT,
ADD COLUMN "resume_updated_at" TIMESTAMPTZ;

-- Backfill resume_updated_at for existing uploads
UPDATE "seeker_profiles"
SET "resume_updated_at" = "updated_at"
WHERE "resume_url" IS NOT NULL AND "resume_updated_at" IS NULL;
