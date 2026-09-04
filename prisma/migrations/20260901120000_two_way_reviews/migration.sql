-- Phase 4.1: two-way reviews (double-blind reveal, publish-then-dispute).
-- See prisma/schema.prisma's "TWO-WAY REVIEWS" section for the design notes
-- this migration implements (real FKs instead of polymorphic subject ids,
-- the applicationId+direction unique, etc).

-- AlterTable: anchor for the 14-day reveal window. `updated_at` can't serve
-- this because it changes on every later edit (notes, rating, re-hire...).
ALTER TABLE "applications" ADD COLUMN "hired_at" TIMESTAMP(3);

-- Backfill hired_at for pre-existing HIRED applications from updated_at.
-- This is approximate — updated_at reflects the *last* write to the row,
-- not necessarily the moment it became HIRED, and could be later if the
-- application was edited again after hiring (rating, internal notes, etc).
-- Acceptable here only because there are no real users/data on this table
-- yet (pre-launch); do not copy this backfill approach once real hires
-- exist without re-checking that assumption.
UPDATE "applications" SET "hired_at" = "updated_at" WHERE "status" = 'HIRED' AND "hired_at" IS NULL;

-- CreateEnum
CREATE TYPE "ReviewDirection" AS ENUM ('SEEKER_TO_COMPANY', 'COMPANY_TO_SEEKER');
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING_REVEAL', 'PUBLISHED', 'DISPUTED', 'HIDDEN');

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "author_user_id" TEXT NOT NULL,
    "direction" "ReviewDirection" NOT NULL,
    "subject_company_id" TEXT,
    "subject_seeker_id" TEXT,
    "rating" INTEGER NOT NULL,
    "body" TEXT NOT NULL,
    "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING_REVEAL',
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revealed_at" TIMESTAMP(3),
    "dispute_reason" TEXT,
    "disputed_at" TIMESTAMP(3),
    "resolved_at" TIMESTAMP(3),
    "resolved_by_user_id" TEXT,
    "resolution_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "reviews_application_id_direction_key" ON "reviews"("application_id", "direction");
CREATE INDEX "reviews_subject_company_id_status_idx" ON "reviews"("subject_company_id", "status");
CREATE INDEX "reviews_subject_seeker_id_status_idx" ON "reviews"("subject_seeker_id", "status");

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_author_user_id_fkey" FOREIGN KEY ("author_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_subject_company_id_fkey" FOREIGN KEY ("subject_company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_subject_seeker_id_fkey" FOREIGN KEY ("subject_seeker_id") REFERENCES "seeker_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Prisma's schema DSL can't express CHECK constraints, so they're added here
-- in raw SQL (see prisma/schema.prisma's Review model comment).
--
-- 1) Rating must be a whole-star value in [1, 5].
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_rating_range_check"
  CHECK ("rating" BETWEEN 1 AND 5);

-- 2) Exactly one subject FK is set, and it must be the one matching
-- `direction` — this is the DB-level guarantee behind the "two nullable FKs,
-- not polymorphic subjectType/subjectId" design: a SEEKER_TO_COMPANY row can
-- never point at a seeker as its subject (or vice versa), and a row can
-- never end up with both or neither subject set.
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_subject_matches_direction_check"
  CHECK (
    ("direction" = 'SEEKER_TO_COMPANY' AND "subject_company_id" IS NOT NULL AND "subject_seeker_id" IS NULL)
    OR
    ("direction" = 'COMPANY_TO_SEEKER' AND "subject_seeker_id" IS NOT NULL AND "subject_company_id" IS NULL)
  );
