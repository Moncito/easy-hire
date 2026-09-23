-- Two-factor authentication, Phase 1 (docs/build-plan.md "Sprint 13 —
-- approved (two-factor auth, Phase 1 only, 2026-09-23)"; full design in
-- docs/two-factor-auth-plan.md).
--
-- Purely additive: two nullable columns and one new table. Nothing is
-- altered or dropped.
--
-- SCOPE: this is enrollment STORAGE only. Auth.ts is not touched by this
-- change, so 2FA is recorded but NOT enforced at login. Enforcement is
-- Phase 2 and is the part that can lock real users out of real accounts.
--
-- 1. users.totp_secret — the shared secret, AES-256-GCM encrypted with
--    TOTP_ENCRYPTION_KEY. Never stored raw. A plaintext secret would make a
--    single database leak WORSE than having no 2FA at all: users would
--    believe they were protected while an attacker generated valid codes
--    indefinitely.
--
--    Operational warning: TOTP_ENCRYPTION_KEY must be treated like a
--    database credential. If it is lost or rotated, every enrolled user is
--    locked out simultaneously and the secrets are unrecoverable.
--
-- 2. users.totp_enabled_at — NULL means not enrolled, OR enrolled but never
--    confirmed. Enforcement must key off this column and never off the mere
--    presence of totp_secret, so an abandoned half-finished enrollment can
--    never gate a login. Enrollment only stamps this after the user submits
--    a working code.
--
-- 3. two_factor_recovery_codes — single-use fallback codes, hashed because
--    they are credentials in exactly the way a password is. Without them a
--    lost phone is a permanent lockout and there is no admin override yet.
--    A table rather than an array column on users so each code's
--    consumption is individually recordable.

ALTER TABLE "users"
  ADD COLUMN "totp_secret" TEXT,
  ADD COLUMN "totp_enabled_at" TIMESTAMP(3);

CREATE TABLE "two_factor_recovery_codes" (
  "id"         TEXT NOT NULL,
  "user_id"    TEXT NOT NULL,
  "code_hash"  TEXT NOT NULL,
  "used_at"    TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "two_factor_recovery_codes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "two_factor_recovery_codes_user_id_idx"
  ON "two_factor_recovery_codes"("user_id");

ALTER TABLE "two_factor_recovery_codes"
  ADD CONSTRAINT "two_factor_recovery_codes_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
