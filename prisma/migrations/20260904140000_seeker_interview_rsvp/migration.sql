-- Phase D (seeker-side UX plan): candidate accept/decline on interviews.
-- Deliberately separate from the existing `status` (InterviewStatus) column
-- — see prisma/schema.prisma's Interview model comment. This migration must
-- never touch the partial unique index
-- `interviews_application_id_scheduled_at_scheduled_key` (see
-- prisma/migrations/20260825000000_interview_slot_unique_when_scheduled) or
-- any of the other SQL-only DB objects outside Prisma's schema DSL.

-- CreateEnum
CREATE TYPE "SeekerInterviewResponse" AS ENUM ('ACCEPTED', 'DECLINED');

-- AlterTable: nullable with no default — null means the seeker hasn't
-- responded yet, same "nullable, no default" precedent as
-- seeker_profiles.id_verification_status.
ALTER TABLE "interviews" ADD COLUMN "seeker_response_status" "SeekerInterviewResponse";
ALTER TABLE "interviews" ADD COLUMN "seeker_responded_at" TIMESTAMP(3);
