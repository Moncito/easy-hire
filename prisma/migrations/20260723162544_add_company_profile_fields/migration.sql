-- AlterTable
ALTER TABLE "companies" ADD COLUMN     "facebook_url" TEXT,
ADD COLUMN     "founded_year" INTEGER,
ADD COLUMN     "headquarters" TEXT,
ADD COLUMN     "highlights" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "instagram_url" TEXT,
ADD COLUMN     "linkedin_url" TEXT,
ADD COLUMN     "x_url" TEXT;
