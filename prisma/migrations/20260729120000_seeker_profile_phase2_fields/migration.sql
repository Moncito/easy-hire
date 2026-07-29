-- CreateEnum
CREATE TYPE "ProfileVisibility" AS ENUM ('HIDDEN', 'STANDARD', 'PUBLIC');

-- AlterTable
ALTER TABLE "seeker_profiles"
ADD COLUMN "visibility" "ProfileVisibility" NOT NULL DEFAULT 'STANDARD',
ADD COLUMN "languages" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "timezone" TEXT DEFAULT 'Asia/Manila';

-- Migrate boolean profile_visibility to enum visibility
UPDATE "seeker_profiles" SET "visibility" = 'HIDDEN' WHERE "profile_visibility" = false;
UPDATE "seeker_profiles" SET "visibility" = 'STANDARD' WHERE "profile_visibility" = true;

-- DropColumn
ALTER TABLE "seeker_profiles" DROP COLUMN "profile_visibility";
