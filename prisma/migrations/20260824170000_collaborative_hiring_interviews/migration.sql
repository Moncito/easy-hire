-- Collaborative Hiring Phase 3: internal interview scheduling and interviewer notes.
CREATE TYPE "InterviewStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED');
CREATE TABLE "interviews" (
  "id" TEXT NOT NULL, "application_id" TEXT NOT NULL, "scheduled_at" TIMESTAMP(3) NOT NULL,
  "duration_mins" INTEGER NOT NULL DEFAULT 30, "format" TEXT NOT NULL DEFAULT 'VIDEO', "location" TEXT,
  "status" "InterviewStatus" NOT NULL DEFAULT 'SCHEDULED', "outcome" TEXT, "created_by" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "interviews_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "interviews_application_id_scheduled_at_idx" ON "interviews"("application_id", "scheduled_at");
CREATE INDEX "interviews_scheduled_at_status_idx" ON "interviews"("scheduled_at", "status");
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE TABLE "interview_participants" (
  "id" TEXT NOT NULL, "interview_id" TEXT NOT NULL, "member_id" TEXT NOT NULL, "notes" TEXT, "outcome" TEXT, "completed_at" TIMESTAMP(3),
  CONSTRAINT "interview_participants_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "interview_participants_interview_id_member_id_key" ON "interview_participants"("interview_id", "member_id");
CREATE INDEX "interview_participants_member_id_interview_id_idx" ON "interview_participants"("member_id", "interview_id");
ALTER TABLE "interview_participants" ADD CONSTRAINT "interview_participants_interview_id_fkey" FOREIGN KEY ("interview_id") REFERENCES "interviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "interview_participants" ADD CONSTRAINT "interview_participants_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "company_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
