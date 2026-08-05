-- Sprint 7-8: employer verification documents + screening questions (answers only, no knockout)

ALTER TABLE "companies" ADD COLUMN "verification_rejection_reason" TEXT;

CREATE TABLE "verification_documents" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "doc_type" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verification_documents_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "screening_questions" (
    "id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "screening_questions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "application_answers" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "answer_text" TEXT NOT NULL,

    CONSTRAINT "application_answers_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "verification_documents_company_id_idx" ON "verification_documents"("company_id");

CREATE INDEX "screening_questions_job_id_idx" ON "screening_questions"("job_id");

CREATE UNIQUE INDEX "application_answers_application_id_question_id_key" ON "application_answers"("application_id", "question_id");
CREATE INDEX "application_answers_application_id_idx" ON "application_answers"("application_id");

ALTER TABLE "verification_documents" ADD CONSTRAINT "verification_documents_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "screening_questions" ADD CONSTRAINT "screening_questions_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "application_answers" ADD CONSTRAINT "application_answers_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "application_answers" ADD CONSTRAINT "application_answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "screening_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
