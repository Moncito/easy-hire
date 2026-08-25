-- Collaborative Hiring Phase 2: job teams and structured scorecards.
CREATE TYPE "EvaluationRecommendation" AS ENUM ('STRONG_NO', 'NO', 'YES', 'STRONG_YES');

CREATE TABLE "job_team_members" (
  "id" TEXT NOT NULL,
  "job_id" TEXT NOT NULL,
  "member_id" TEXT NOT NULL,
  "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "job_team_members_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "job_team_members_job_id_member_id_key" ON "job_team_members"("job_id", "member_id");
CREATE INDEX "job_team_members_member_id_job_id_idx" ON "job_team_members"("member_id", "job_id");
ALTER TABLE "job_team_members" ADD CONSTRAINT "job_team_members_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "job_team_members" ADD CONSTRAINT "job_team_members_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "company_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "scorecard_templates" (
  "id" TEXT NOT NULL, "job_id" TEXT NOT NULL, "title" TEXT NOT NULL DEFAULT 'Hiring scorecard', "instructions" TEXT,
  "is_active" BOOLEAN NOT NULL DEFAULT true, "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "scorecard_templates_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "scorecard_templates_job_id_is_active_idx" ON "scorecard_templates"("job_id", "is_active");
ALTER TABLE "scorecard_templates" ADD CONSTRAINT "scorecard_templates_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "scorecard_criteria" (
  "id" TEXT NOT NULL, "template_id" TEXT NOT NULL, "label" TEXT NOT NULL, "description" TEXT, "sort_order" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "scorecard_criteria_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "scorecard_criteria_template_id_sort_order_idx" ON "scorecard_criteria"("template_id", "sort_order");
ALTER TABLE "scorecard_criteria" ADD CONSTRAINT "scorecard_criteria_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "scorecard_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "candidate_evaluations" (
  "id" TEXT NOT NULL, "application_id" TEXT NOT NULL, "member_id" TEXT NOT NULL, "template_id" TEXT NOT NULL,
  "recommendation" "EvaluationRecommendation", "summary" TEXT, "submitted_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "candidate_evaluations_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "candidate_evaluations_application_id_member_id_key" ON "candidate_evaluations"("application_id", "member_id");
CREATE INDEX "candidate_evaluations_application_id_submitted_at_idx" ON "candidate_evaluations"("application_id", "submitted_at");
CREATE INDEX "candidate_evaluations_member_id_submitted_at_idx" ON "candidate_evaluations"("member_id", "submitted_at");
ALTER TABLE "candidate_evaluations" ADD CONSTRAINT "candidate_evaluations_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "candidate_evaluations" ADD CONSTRAINT "candidate_evaluations_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "company_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "candidate_evaluations" ADD CONSTRAINT "candidate_evaluations_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "scorecard_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "evaluation_ratings" (
  "id" TEXT NOT NULL, "evaluation_id" TEXT NOT NULL, "criterion_id" TEXT NOT NULL, "score" INTEGER NOT NULL,
  CONSTRAINT "evaluation_ratings_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "evaluation_ratings_score_check" CHECK ("score" >= 1 AND "score" <= 5)
);
CREATE UNIQUE INDEX "evaluation_ratings_evaluation_id_criterion_id_key" ON "evaluation_ratings"("evaluation_id", "criterion_id");
CREATE INDEX "evaluation_ratings_criterion_id_idx" ON "evaluation_ratings"("criterion_id");
ALTER TABLE "evaluation_ratings" ADD CONSTRAINT "evaluation_ratings_evaluation_id_fkey" FOREIGN KEY ("evaluation_id") REFERENCES "candidate_evaluations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "evaluation_ratings" ADD CONSTRAINT "evaluation_ratings_criterion_id_fkey" FOREIGN KEY ("criterion_id") REFERENCES "scorecard_criteria"("id") ON DELETE CASCADE ON UPDATE CASCADE;
