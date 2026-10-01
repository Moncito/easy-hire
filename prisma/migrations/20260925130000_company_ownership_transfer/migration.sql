-- Company ownership transfer.
--
-- Purely additive: two nullable columns and one index. Nothing is altered or
-- dropped, and NULL (every existing row) means "no transfer offered".
--
-- companies.pending_owner_user_id — the team member the owner has offered
-- the company to. Ownership (companies.user_id) moves only when that member
-- accepts, so this is an offer, not a change. No foreign key: acceptance
-- re-checks the nominee is still an ACTIVE company member, which already
-- covers a deleted or removed account.
--
-- companies.owner_transfer_requested_at — when the offer was made. Offers
-- lapse 7 days later (OWNERSHIP_TRANSFER_TTL_DAYS in
-- lib/company-ownership-transfer.ts); nothing sweeps them, expiry is checked
-- on read.
--
-- The index serves the nominee's "offers waiting for me" lookup on /hiring.
--
-- lock_timeout: ALTER TABLE needs an exclusive lock on companies, and while
-- it waits for one every other query on the table queues behind it. The
-- first attempt at this migration sat behind an idle-in-transaction
-- connection until the 2-minute statement timeout. Fail fast instead.

SET lock_timeout = '5s';

ALTER TABLE "companies"
  ADD COLUMN "pending_owner_user_id" TEXT,
  ADD COLUMN "owner_transfer_requested_at" TIMESTAMP(3);

CREATE INDEX "companies_pending_owner_user_id_idx"
  ON "companies"("pending_owner_user_id");
