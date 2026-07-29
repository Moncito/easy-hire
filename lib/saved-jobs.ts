import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";
import { ensureSeekerProfile } from "@/lib/seekers";

export async function listSavedJobIds(userId: string): Promise<string[]> {
  const profile = await prisma.seekerProfile.findUnique({ where: { userId } });
  if (!profile) return [];

  const saved = await prisma.savedJob.findMany({
    where: { seekerId: profile.id },
    select: { jobId: true },
  });

  return saved.map((s) => s.jobId);
}

export async function listSavedJobs(userId: string) {
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

  return { ok: true, saved: true };
}

export async function unsaveJob(userId: string, jobId: string) {
  const profile = await prisma.seekerProfile.findUnique({ where: { userId } });
  if (!profile) return { ok: true, saved: false };

  await prisma.savedJob.deleteMany({
    where: { seekerId: profile.id, jobId },
  });

  return { ok: true, saved: false };
}
