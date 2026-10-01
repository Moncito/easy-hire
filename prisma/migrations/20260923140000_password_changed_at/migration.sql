-- Password age (docs/build-plan.md "Sprint 12c — approved (password age,
-- 2026-09-23)").
--
-- Purely additive: one nullable column. Nothing is altered or dropped.
--
-- users.password_changed_at is stamped by changePassword
-- (lib/account/change-password.ts) and resetPassword
-- (lib/auth/credentials-recovery.ts).
--
-- The visible half is "last changed N days ago" in the Security panel. The
-- load-bearing half is session invalidation: Auth.ts uses
-- `session: { strategy: "jwt" }` and there is no Session model, so existing
-- tokens on other devices cannot be revoked server-side — the limitation
-- documented in lib/account/change-password.ts. The standard way out is a
-- passwordChangedAt claim compared in the jwt callback, which is impossible
-- without this timestamp.
--
-- NULL means "never recorded", deliberately with no backfill. Existing
-- accounts genuinely have no known last-change date, and defaulting to
-- now() or created_at would make the UI state something untrue. Any
-- consumer must treat NULL as unknown rather than as a date.

ALTER TABLE "users"
  ADD COLUMN "password_changed_at" TIMESTAMP(3);
