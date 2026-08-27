-- CreateEnum
CREATE TYPE "ApplicationActivityType" AS ENUM ('NOTE', 'STAGE_CHANGE');

-- CreateTable
CREATE TABLE "application_activities" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "type" "ApplicationActivityType" NOT NULL,
    "body" TEXT,
    "actor_member_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "application_activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "application_activities_application_id_created_at_idx" ON "application_activities"("application_id", "created_at");

-- AddForeignKey
ALTER TABLE "application_activities" ADD CONSTRAINT "application_activities_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_activities" ADD CONSTRAINT "application_activities_actor_member_id_fkey" FOREIGN KEY ("actor_member_id") REFERENCES "company_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

