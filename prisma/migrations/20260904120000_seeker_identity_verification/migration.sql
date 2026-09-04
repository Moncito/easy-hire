-- Phase 4.2: VA identity verification score.
-- Reuses the existing VerificationStatus enum (PENDING/APPROVED/REJECTED) —
-- see prisma/schema.prisma's SeekerProfile section for design notes.
-- This migration only ADDs columns/a table/indexes; it must never touch the
-- four SQL-only DB objects that live outside Prisma's schema DSL (the two
-- search_vector generated columns + their GIN indexes, the partial unique on
-- interviews, and the supabase_realtime publication).

-- AlterTable: seeker_profiles gets five new nullable/defaulted columns.
-- `id_verification_status` is deliberately nullable with no default (unlike
-- companies.verified_status, which defaults to PENDING) — a seeker who has
-- never submitted identity documents has no status at all yet.
ALTER TABLE "seeker_profiles" ADD COLUMN "id_verification_status" "VerificationStatus";
ALTER TABLE "seeker_profiles" ADD COLUMN "id_verified_at" TIMESTAMP(3);
ALTER TABLE "seeker_profiles" ADD COLUMN "id_verification_rejection_reason" TEXT;
ALTER TABLE "seeker_profiles" ADD COLUMN "verification_score" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "seeker_profiles" ADD COLUMN "verification_score_updated_at" TIMESTAMP(3);

-- CreateIndex: powers the admin pending-identity-verification queue.
CREATE INDEX IF NOT EXISTS "seeker_profiles_id_verification_status_idx" ON "seeker_profiles"("id_verification_status");

-- CreateTable
CREATE TABLE "seeker_identity_documents" (
    "id" TEXT NOT NULL,
    "seeker_profile_id" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "doc_type" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "seeker_identity_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "seeker_identity_documents_seeker_profile_id_idx" ON "seeker_identity_documents"("seeker_profile_id");

-- AddForeignKey
ALTER TABLE "seeker_identity_documents" ADD CONSTRAINT "seeker_identity_documents_seeker_profile_id_fkey" FOREIGN KEY ("seeker_profile_id") REFERENCES "seeker_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
