-- Email change (docs/build-plan.md "Sprint 12b — approved (email change,
-- 2026-09-23)"). There is currently no way to change your email address
-- while signed in at all.
--
-- Purely additive: one nullable column and one new enum value. Nothing is
-- altered or dropped.
--
-- 1. users.pending_email — the requested address is parked here and only
--    swapped into users.email once the user proves they control it.
--
--    The alternative is an account-loss bug: swapping immediately and
--    clearing email_verified_at means a typo'd address leaves the account
--    with a login email nobody can receive, and the correction is sent to
--    that same wrong mailbox.
--
--    Deliberately NOT unique. A stale pending value must never block
--    another account from later claiming that address; the real collision
--    check runs against users.email at swap time, where the existing unique
--    constraint enforces it.
--
-- 2. VerificationPurpose.EMAIL_CHANGE — VerificationToken has purpose,
--    token_hash, expires_at and consumed_at but no payload column, so it
--    cannot carry the target address itself; that is why pending_email
--    exists. This value keeps an email-change token from being
--    interchangeable with an EMAIL_VERIFY or PASSWORD_RESET token.
--
--    The value is only ADDED here and not used in this migration, which is
--    what keeps ALTER TYPE ... ADD VALUE safe inside Prisma's transaction
--    on PostgreSQL 12+.

ALTER TABLE "users"
  ADD COLUMN "pending_email" TEXT;

ALTER TYPE "VerificationPurpose" ADD VALUE 'EMAIL_CHANGE';
