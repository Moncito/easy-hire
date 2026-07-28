-- AlterTable
ALTER TABLE "seeker_profiles" ADD COLUMN     "linkedin_url" TEXT,
ADD COLUMN     "portfolio_url" TEXT,
ADD COLUMN     "certifications" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "photo_url" TEXT;
