-- Password reset + email verification. Single-use, hashed tokens shared by
-- both flows via VerificationPurpose, mirroring the company_invitations
-- token pattern (raw token emailed, only its SHA-256 hash persisted).

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email_verified_at" TIMESTAMP(3);

-- Grandfather every pre-existing account as verified so this migration can
-- never lock out current test/production users — only accounts created after
-- this migration start out unverified and go through the new flow. See
-- lib/auth/credentials-recovery.ts for the gate this backs (requireVerifiedEmail).
UPDATE "users" SET "email_verified_at" = "created_at" WHERE "email_verified_at" IS NULL;

DO $$ BEGIN
  CREATE TYPE "VerificationPurpose" AS ENUM ('EMAIL_VERIFY', 'PASSWORD_RESET');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "verification_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "purpose" "VerificationPurpose" NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "consumed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verification_tokens_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "verification_tokens_token_hash_key" ON "verification_tokens"("token_hash");
CREATE INDEX IF NOT EXISTS "verification_tokens_user_id_purpose_idx" ON "verification_tokens"("user_id", "purpose");

ALTER TABLE "verification_tokens" ADD CONSTRAINT "verification_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
