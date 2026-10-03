-- Terms/Privacy acceptance per user.
--
-- Purely additive: two nullable columns on users. Existing rows stay NULL,
-- which the proxy gate treats as "not accepted" and routes to /accept-terms
-- once (see lib/legal/terms-version.ts).

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "terms_accepted_at" TIMESTAMP(3),
ADD COLUMN     "terms_version" TEXT;
