-- Collaborative Hiring Phase 0–1: manual entitlement, team memberships,
-- and single-use invitations. Disabling the entitlement never removes data.

ALTER TABLE "companies"
  ADD COLUMN IF NOT EXISTS "collaborative_hiring_enabled" BOOLEAN NOT NULL DEFAULT false;

CREATE TYPE "CompanyMemberRole" AS ENUM ('OWNER', 'RECRUITER', 'HIRING_MANAGER', 'VIEWER');
CREATE TYPE "CompanyMemberStatus" AS ENUM ('ACTIVE', 'REMOVED');

CREATE TABLE "company_members" (
  "id" TEXT NOT NULL,
  "company_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "role" "CompanyMemberRole" NOT NULL,
  "status" "CompanyMemberStatus" NOT NULL DEFAULT 'ACTIVE',
  "invited_by" TEXT,
  "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "company_members_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "company_invitations" (
  "id" TEXT NOT NULL,
  "company_id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "role" "CompanyMemberRole" NOT NULL,
  "token_hash" TEXT NOT NULL,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "invited_by" TEXT NOT NULL,
  "accepted_at" TIMESTAMP(3),
  "revoked_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "company_invitations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "company_members_company_id_user_id_key" ON "company_members"("company_id", "user_id");
CREATE INDEX "company_members_company_id_status_idx" ON "company_members"("company_id", "status");
CREATE INDEX "company_members_user_id_status_idx" ON "company_members"("user_id", "status");
CREATE UNIQUE INDEX "company_invitations_token_hash_key" ON "company_invitations"("token_hash");
CREATE INDEX "company_invitations_company_id_email_idx" ON "company_invitations"("company_id", "email");
CREATE INDEX "company_invitations_company_id_expires_at_idx" ON "company_invitations"("company_id", "expires_at");

ALTER TABLE "company_members"
  ADD CONSTRAINT "company_members_company_id_fkey"
  FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "company_members"
  ADD CONSTRAINT "company_members_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "company_invitations"
  ADD CONSTRAINT "company_invitations_company_id_fkey"
  FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Preserve existing single-owner employers as full owners of their company.
INSERT INTO "company_members" ("id", "company_id", "user_id", "role", "status", "joined_at", "created_at", "updated_at")
SELECT 'owner_' || "id", "id", "user_id", 'OWNER', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "companies"
ON CONFLICT ("company_id", "user_id") DO NOTHING;
