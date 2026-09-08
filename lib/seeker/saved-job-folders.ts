import { unstable_cache, revalidateTag } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";
import { ensureSeekerProfile } from "@/lib/seekers";
import { seekerSavedJobFoldersTag } from "@/lib/seeker/cache-tags";
import {
  savedJobFolderCreateSchema,
  savedJobFolderUpdateSchema,
  savedJobFolderItemCreateSchema,
} from "@/lib/validations/saved-job-folder";

const SAVED_JOB_FOLDERS_REVALIDATE_SECONDS = 30;

// Mirrors the 15-alert (lib/seeker/job-alerts.ts) and 200-saved-job
// (lib/seeker/saved-jobs.ts) caps — bound every findMany per the repo-wide
// convention (see the INTERVIEWS_TAKE comment in lib/seeker/dashboard.ts).
const SAVED_JOB_FOLDERS_TAKE = 20;
const SAVED_JOB_FOLDERS_CAP = 20;
const SAVED_JOB_FOLDER_ITEMS_TAKE = 200;

/** Drop the cached folders list/detail for one seeker (call after any create/rename/delete/item mutation). */
export function invalidateSeekerSavedJobFolders(userId: string) {
  revalidateTag(seekerSavedJobFoldersTag(userId), "max");
}

async function requireFolderForSeeker(seekerId: string, folderId: string) {
  const folder = await prisma.savedJobFolder.findFirst({ where: { id: folderId, seekerId } });
  if (!folder) {
    throw new ApiError("Folder not found", 404);
  }
  return folder;
}

export function listSavedJobFolders(userId: string) {
  return unstable_cache(
    async () => {
      const profile = await prisma.seekerProfile.findUnique({ where: { userId } });
      if (!profile) return [];

      return prisma.savedJobFolder.findMany({
        where: { seekerId: profile.id },
        orderBy: { createdAt: "desc" },
        take: SAVED_JOB_FOLDERS_TAKE,
        include: { _count: { select: { items: true } } },
      });
    },
    ["seeker-saved-job-folders", userId],
    { revalidate: SAVED_JOB_FOLDERS_REVALIDATE_SECONDS, tags: [seekerSavedJobFoldersTag(userId)] }
  )();
}

export function getSavedJobFolder(userId: string, folderId: string) {
  return unstable_cache(
    async () => {
      const profile = await prisma.seekerProfile.findUnique({ where: { userId } });
      if (!profile) {
        throw new ApiError("Folder not found", 404);
      }

      const folder = await prisma.savedJobFolder.findFirst({
        where: { id: folderId, seekerId: profile.id },
        include: {
          items: {
            orderBy: { addedAt: "desc" },
            take: SAVED_JOB_FOLDER_ITEMS_TAKE,
            include: {
              savedJob: {
                include: {
                  job: {
                    include: {
                      company: {
                        select: { id: true, companyName: true, logoUrl: true, verifiedStatus: true, industry: true },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!folder) {
        throw new ApiError("Folder not found", 404);
      }

      return {
        id: folder.id,
        seekerId: folder.seekerId,
        name: folder.name,
        createdAt: folder.createdAt.toISOString(),
        updatedAt: folder.updatedAt.toISOString(),
        items: folder.items.map((item) => ({
          id: item.id,
          savedJobId: item.savedJobId,
          addedAt: item.addedAt.toISOString(),
          savedAt: item.savedJob.savedAt.toISOString(),
          job: {
            id: item.savedJob.job.id,
            title: item.savedJob.job.title,
            category: item.savedJob.job.category,
            industry: item.savedJob.job.industry,
            employmentType: item.savedJob.job.employmentType,
            remoteType: item.savedJob.job.remoteType,
            location: item.savedJob.job.location,
            salaryMin: item.savedJob.job.salaryMin,
            salaryMax: item.savedJob.job.salaryMax,
            salaryPeriod: item.savedJob.job.salaryPeriod,
            publishedAt: item.savedJob.job.publishedAt?.toISOString() ?? null,
            createdAt: item.savedJob.job.createdAt.toISOString(),
            expiresAt: item.savedJob.job.expiresAt?.toISOString() ?? null,
            company: item.savedJob.job.company,
          },
        })),
      };
    },
    ["seeker-saved-job-folder", userId, folderId],
    { revalidate: SAVED_JOB_FOLDERS_REVALIDATE_SECONDS, tags: [seekerSavedJobFoldersTag(userId)] }
  )();
}

export async function createSavedJobFolder(userId: string, raw: unknown) {
  const input = savedJobFolderCreateSchema.parse(raw);
  const profile = await ensureSeekerProfile(userId);

  const folderCount = await prisma.savedJobFolder.count({ where: { seekerId: profile.id } });
  if (folderCount >= SAVED_JOB_FOLDERS_CAP) {
    throw new ApiError(`You've reached the maximum number of folders (${SAVED_JOB_FOLDERS_CAP})`, 400);
  }

  try {
    const folder = await prisma.savedJobFolder.create({
      data: { seekerId: profile.id, name: input.name },
    });
    invalidateSeekerSavedJobFolders(userId);
    return folder;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new ApiError("You already have a folder with that name", 409);
    }
    throw error;
  }
}

export async function renameSavedJobFolder(userId: string, folderId: string, raw: unknown) {
  const profile = await ensureSeekerProfile(userId);
  await requireFolderForSeeker(profile.id, folderId);
  const input = savedJobFolderUpdateSchema.parse(raw);

  try {
    const folder = await prisma.savedJobFolder.update({
      where: { id: folderId },
      data: { name: input.name },
    });
    invalidateSeekerSavedJobFolders(userId);
    return folder;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new ApiError("You already have a folder with that name", 409);
    }
    throw error;
  }
}

export async function deleteSavedJobFolder(userId: string, folderId: string) {
  const profile = await ensureSeekerProfile(userId);
  await requireFolderForSeeker(profile.id, folderId);

  await prisma.savedJobFolder.delete({ where: { id: folderId } });
  invalidateSeekerSavedJobFolders(userId);
  return { ok: true };
}

export async function addJobToFolder(userId: string, folderId: string, raw: unknown) {
  const profile = await ensureSeekerProfile(userId);
  await requireFolderForSeeker(profile.id, folderId);
  const input = savedJobFolderItemCreateSchema.parse(raw);

  const savedJob = await prisma.savedJob.findFirst({
    where: { id: input.savedJobId, seekerId: profile.id },
  });
  if (!savedJob) {
    throw new ApiError("Saved job not found", 404);
  }

  const item = await prisma.savedJobFolderItem.upsert({
    where: { folderId_savedJobId: { folderId, savedJobId: savedJob.id } },
    create: { folderId, savedJobId: savedJob.id },
    update: {},
  });
  invalidateSeekerSavedJobFolders(userId);

  return item;
}

export async function removeJobFromFolder(userId: string, folderId: string, savedJobId: string) {
  const profile = await ensureSeekerProfile(userId);
  await requireFolderForSeeker(profile.id, folderId);

  await prisma.savedJobFolderItem.deleteMany({ where: { folderId, savedJobId } });
  invalidateSeekerSavedJobFolders(userId);

  return { ok: true };
}
