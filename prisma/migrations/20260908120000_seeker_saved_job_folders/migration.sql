-- Phase E2 (seeker-side UX plan): saved-job folders. Mirrors the employer-side
-- SavedTalentList / SavedTalentListItem shape (see
-- prisma/migrations/20260815234500_employer_pro_backend), but free for every
-- seeker -- no plan gate.
--
-- This migration is purely additive: it creates two new tables and their
-- indexes/foreign keys. It does not alter or drop any existing table, column,
-- index, or constraint.
--
-- Design note: saved_job_folder_items.saved_job_id references saved_jobs, not
-- jobs. A folder organizes things the seeker has already saved, so un-saving
-- a job (deleting its saved_jobs row) cascades and removes it from every
-- folder automatically, rather than leaving a folder entry pointing at a job
-- that's no longer on the shortlist.

-- CreateTable
CREATE TABLE "saved_job_folders" (
    "id" TEXT NOT NULL,
    "seeker_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saved_job_folders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_job_folder_items" (
    "id" TEXT NOT NULL,
    "folder_id" TEXT NOT NULL,
    "saved_job_id" TEXT NOT NULL,
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_job_folder_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "saved_job_folders_seeker_id_idx" ON "saved_job_folders"("seeker_id");

-- CreateIndex
CREATE UNIQUE INDEX "saved_job_folders_seeker_id_name_key" ON "saved_job_folders"("seeker_id", "name");

-- CreateIndex
CREATE INDEX "saved_job_folder_items_folder_id_idx" ON "saved_job_folder_items"("folder_id");

-- CreateIndex
CREATE INDEX "saved_job_folder_items_saved_job_id_idx" ON "saved_job_folder_items"("saved_job_id");

-- CreateIndex
CREATE UNIQUE INDEX "saved_job_folder_items_folder_id_saved_job_id_key" ON "saved_job_folder_items"("folder_id", "saved_job_id");

-- AddForeignKey
ALTER TABLE "saved_job_folders" ADD CONSTRAINT "saved_job_folders_seeker_id_fkey" FOREIGN KEY ("seeker_id") REFERENCES "seeker_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_job_folder_items" ADD CONSTRAINT "saved_job_folder_items_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "saved_job_folders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_job_folder_items" ADD CONSTRAINT "saved_job_folder_items_saved_job_id_fkey" FOREIGN KEY ("saved_job_id") REFERENCES "saved_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
