-- AlterTable
ALTER TABLE "seeker_profiles"
ADD COLUMN "resumes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- Backfill resumes from primary resume fields
UPDATE "seeker_profiles"
SET "resumes" = ARRAY[
  COALESCE("resume_label", 'Resume') || '|' || "resume_url" || '|' || COALESCE("resume_updated_at"::text, "updated_at"::text)
]
WHERE "resume_url" IS NOT NULL AND cardinality("resumes") = 0;

-- Normalize plain skills to skill|Proficient
UPDATE "seeker_profiles"
SET "skills" = (
  SELECT COALESCE(array_agg(
    CASE
      WHEN skill LIKE '%|%' THEN skill
      ELSE skill || '|Proficient'
    END
  ), ARRAY[]::TEXT[])
  FROM unnest("skills") AS skill
)
WHERE cardinality("skills") > 0;
