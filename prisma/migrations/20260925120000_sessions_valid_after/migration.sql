-- Server-side session revocation for JWT sessions.
--
-- Purely additive: one nullable column. Nothing is altered or dropped, and
-- NULL (every existing row) means "no cutoff", so no session is revoked by
-- applying this migration.
--
-- users.sessions_valid_after — the jwt callback in Auth.ts rejects any token
-- issued before this instant. Set on password change, password reset, a
-- Google sign-in evicting an unverified password, and the security panel's
-- "Sign out of other devices". There is no Session table (JWT strategy), so
-- a per-user cutoff is the whole revocation mechanism.

ALTER TABLE "users"
  ADD COLUMN "sessions_valid_after" TIMESTAMP(3);
