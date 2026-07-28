-- Sprint 5: messaging, saved seekers, seeker talent search FTS

CREATE TABLE "conversations" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "seeker_id" TEXT NOT NULL,
    "job_id" TEXT,
    "last_message_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "sender_user_id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "saved_seekers" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "seeker_id" TEXT NOT NULL,
    "saved_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_seekers_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "conversations_company_id_seeker_id_key" ON "conversations"("company_id", "seeker_id");
CREATE INDEX "conversations_company_id_idx" ON "conversations"("company_id");
CREATE INDEX "conversations_seeker_id_idx" ON "conversations"("seeker_id");

CREATE INDEX "messages_conversation_id_idx" ON "messages"("conversation_id");

CREATE UNIQUE INDEX "saved_seekers_company_id_seeker_id_key" ON "saved_seekers"("company_id", "seeker_id");
CREATE INDEX "saved_seekers_company_id_idx" ON "saved_seekers"("company_id");

ALTER TABLE "conversations" ADD CONSTRAINT "conversations_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_seeker_id_fkey" FOREIGN KEY ("seeker_id") REFERENCES "seeker_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_user_id_fkey" FOREIGN KEY ("sender_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "saved_seekers" ADD CONSTRAINT "saved_seekers_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "saved_seekers" ADD CONSTRAINT "saved_seekers_seeker_id_fkey" FOREIGN KEY ("seeker_id") REFERENCES "seeker_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seeker talent search FTS (skills searched via Prisma fallback — array_to_string is not immutable in PG generated cols)
ALTER TABLE "seeker_profiles" ADD COLUMN IF NOT EXISTS "search_vector" tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce("full_name", '')), 'A') ||
    setweight(to_tsvector('english', coalesce("headline", '')), 'B') ||
    setweight(to_tsvector('english', coalesce("bio", '')), 'C')
  ) STORED;

CREATE INDEX IF NOT EXISTS "seeker_profiles_search_vector_idx" ON "seeker_profiles" USING GIN ("search_vector");
