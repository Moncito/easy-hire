import { unstable_cache, revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";
import { ensureSeekerProfile } from "@/lib/seekers";
import { seekerSavedJobsTag } from "@/lib/seeker/cache-tags";

const SAVED_JOBS_REVALIDATE_SECONDS = 30;

/** Drop the cached saved-jobs list/ids for one seeker (call after save/unsave). */
export function invalidateSeekerSavedJobs(userId: string) {
  revalidateTag(seekerSavedJobsTag(userId), "max");
}

export function listSavedJobIds(userId: string): Promise<string[]> {
  return unstable_cache(
    async () => {
      const profile = await prisma.seekerProfile.findUnique({ where: { userId } });
      if (!profile) return [];

      const saved = await prisma.savedJob.findMany({
        where: { seekerId: profile.id },
        select: { jobId: true },
      });

      return saved.map((s) => s.jobId);
    },
    ["seeker-saved-job-ids", userId],
    { revalidate: SAVED_JOBS_REVALIDATE_SECONDS, tags: [seekerSavedJobsTag(userId)] }
  )();
}

export function listSavedJobs(userId: string) {
  return unstable_cache(
    async () => {
      const profile = await prisma.seekerProfile.findUnique({ where: { userId } });
      if (!profile) return [];

      const saved = await prisma.savedJob.findMany({
        where: { seekerId: profile.id },
        orderBy: { savedAt: "desc" },
        include: {
          job: {
            include: {
              company: {
                select: { id: true, companyName: true, logoUrl: true, verifiedStatus: true, industry: true },
              },
            },
          },
        },
      });

      return saved
        .filter((s) => s.job.status === "ACTIVE")
        .map((s) => ({
          savedAt: s.savedAt.toISOString(),
          job: {
            id: s.job.id,
            title: s.job.title,
            category: s.job.category,
            industry: s.job.industry,
            employmentType: s.job.employmentType,
            remoteType: s.job.remoteType,
            location: s.job.location,
            salaryMin: s.job.salaryMin,
            salaryMax: s.job.salaryMax,
            salaryPeriod: s.job.salaryPeriod,
            publishedAt: s.job.publishedAt?.toISOString() ?? null,
            createdAt: s.job.createdAt.toISOString(),
            expiresAt: s.job.expiresAt?.toISOString() ?? null,
            company: s.job.company,
          },
        }));
    },
    ["seeker-saved-jobs", userId],
    { revalidate: SAVED_JOBS_REVALIDATE_SECONDS, tags: [seekerSavedJobsTag(userId)] }
  )();
}

export async function saveJob(userId: string, jobId: string) {
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) {
    throw new ApiError("Job not found", 404);
  }

  const profile = await ensureSeekerProfile(userId);

  await prisma.savedJob.upsert({
    where: { seekerId_jobId: { seekerId: profile.id, jobId } },
    create: { seekerId: profile.id, jobId },
    update: {},
  });
  invalidateSeekerSavedJobs(userId);

  return { ok: true, saved: true };
}

export async function unsaveJob(userId: string, jobId: string) {
  const profile = await prisma.seekerProfile.findUnique({ where: { userId } });
  if (!profile) return { ok: true, saved: false };

  await prisma.savedJob.deleteMany({
    where: { seekerId: profile.id, jobId },
  });
  invalidateSeekerSavedJobs(userId);

  return { ok: true, saved: false };
}

export async function getAppliedJobIdsForSaved(userId: string, savedJobIds: string[]) {
  if (savedJobIds.length === 0) return [];

  const profile = await prisma.seekerProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!profile) return [];

  const apps = await prisma.application.findMany({
    where: {
      seekerId: profile.id,
      jobId: { in: savedJobIds },
    },
    select: { jobId: true },
  });

  return apps.map((a) => a.jobId);
}

export async function getSavedJobsPageData(userId: string) {
  const saved = await listSavedJobs(userId);
  const appliedJobIds = await getAppliedJobIdsForSaved(
    userId,
    saved.map((s) => s.job.id)
  );
  return { saved, appliedJobIds };
}
