-- Notification preferences (docs/build-plan.md "Sprint 12 — approved
-- (notification preferences, 2026-09-23)"). Resolves
-- docs/seeker-email-audit.md §4 P2.1: there was no opt-out column anywhere
-- in the product, no unsubscribe link, and no List-Unsubscribe header, so a
-- recipient could not turn off any email we send — including the recurring
-- job-alert digest.
--
-- Purely additive: four new columns on users, one on job_alerts, one unique
-- index. No existing table, column, index, or constraint is altered or
-- dropped.
--
-- 1. users.notify_* — the three opt-out flags. They gate EMAIL ONLY. The
--    matching `notifications` row is still written in every case, because
--    muting mail must not erase the user's in-app record of what happened.
--
--    Account-security mail (email verification, password reset, account
--    deletion) and interview scheduled/rescheduled/cancelled deliberately
--    IGNORE these flags: the first three are security notices and the last
--    is a calendar commitment the other party is relying on.
--
--    DEFAULT true, NOT NULL. Every existing user keeps receiving exactly
--    what they receive today, so this migration changes no behaviour on its
--    own — the flags only take effect once send paths start reading them.
--
-- 2. users.unsubscribe_token — an unsubscribe link has to work for a
--    LOGGED-OUT recipient, and a List-Unsubscribe header needs a URL that
--    resolves without a session. Nullable and backfilled lazily on first
--    send rather than generating a token for every existing row here: a
--    one-shot backfill would have to invent randomness inside the migration
--    and could not be re-run safely.
--
-- 3. job_alerts.paused — lets a seeker stop one digest without deleting the
--    alert and losing its keywords and category filter. Deleting the row
--    was previously the only way off a digest.

ALTER TABLE "users"
  ADD COLUMN "notify_messages" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "notify_application_updates" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "notify_product_digest" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "unsubscribe_token" TEXT;

CREATE UNIQUE INDEX "users_unsubscribe_token_key" ON "users"("unsubscribe_token");

ALTER TABLE "job_alerts"
  ADD COLUMN "paused" BOOLEAN NOT NULL DEFAULT false;
