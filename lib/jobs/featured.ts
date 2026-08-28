import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";
import { assertCanFeatureJob, FEATURED_JOB_DURATION_DAYS } from "@/lib/billing/entitlements";
import { invalidateEmployerWorkspace } from "@/lib/employer-cache";
import { invalidatePublicJob, invalidatePublicJobsList } from "@/lib/jobs/public-cache";

async function requireJobForCompany(jobId: string, companyId: string) {
  const job = await prisma.job.findFirst({
    where: { id: jobId, companyId },
    select: { id: true, status: true, featuredUntil: true },
  });

  if (!job) {
    throw new ApiError("Job not found", 404);
  }

  return job;
}

/** Feature a job for `FEATURED_JOB_DURATION_DAYS` days — Employer Pro only. */
export async function featureJob(jobId: string, companyId: string) {
  await assertCanFeatureJob(companyId);
  const job = await requireJobForCompany(jobId, companyId);

  if (job.status !== "ACTIVE") {
    throw new ApiError("Only active jobs can be featured", 400);
  }

  const featuredUntil = new Date();
  featuredUntil.setDate(featuredUntil.getDate() + FEATURED_JOB_DURATION_DAYS);

  const updated = await prisma.job.update({
    where: { id: job.id },
    data: { featuredUntil },
  });

  invalidateEmployerWorkspace(companyId);
  invalidatePublicJobsList();
  invalidatePublicJob(job.id);
  return updated;
}

/** Remove a job's featured placement early. */
export async function unfeatureJob(jobId: string, companyId: string) {
  const job = await requireJobForCompany(jobId, companyId);

  const updated = await prisma.job.update({
    where: { id: job.id },
    data: { featuredUntil: null },
  });

  invalidateEmployerWorkspace(companyId);
  invalidatePublicJobsList();
  invalidatePublicJob(job.id);
  return updated;
}

export function isJobCurrentlyFeatured(featuredUntil: Date | null): boolean {
  return !!featuredUntil && featuredUntil.getTime() > Date.now();
}

/**
 * Public listing ranking sorts by `featuredUntil desc nulls last`, which only
 * stays correct while every non-null `featuredUntil` is in the future. Call
 * this periodically (see the analytics rollup cron) to null out expired
 * placements so they fall back to normal ranking instead of outranking
 * genuinely unfeatured jobs.
 */
export async function clearExpiredFeaturedJobs(): Promise<number> {
  const result = await prisma.job.updateMany({
    where: { featuredUntil: { lt: new Date() } },
    data: { featuredUntil: null },
  });
  return result.count;
}
