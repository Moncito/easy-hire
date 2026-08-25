import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";
import { requireCompanyMembership } from "@/lib/collaborative-hiring";
import { createJob, updateJob, deleteDraftJob, submitJobForReview } from "@/lib/jobs";
import type { JobStatus } from "@/lib/jobs/status";

async function requireCollaborativeJob(companyId: string, actorUserId: string, jobId: string) {
  const membership = await requireCompanyMembership(companyId, actorUserId, "jobs:manage");
  const job = await prisma.job.findFirst({
    where: { id: jobId, companyId },
    include: { screeningQuestions: { orderBy: { sortOrder: "asc" } } },
  });
  if (!job) throw new ApiError("Job not found", 404);
  return { membership, job };
}

export async function createCollaborativeJob(companyId: string, actorUserId: string, raw: unknown) {
  await requireCompanyMembership(companyId, actorUserId, "jobs:manage");
  return createJob(companyId, raw);
}

export async function getCollaborativeJobForEdit(companyId: string, actorUserId: string, jobId: string) {
  const { job } = await requireCollaborativeJob(companyId, actorUserId, jobId);
  return job;
}

export async function updateCollaborativeJob(companyId: string, actorUserId: string, jobId: string, raw: unknown) {
  const { job } = await requireCollaborativeJob(companyId, actorUserId, jobId);
  return updateJob(jobId, job.status as JobStatus, raw, companyId);
}

export async function deleteCollaborativeJob(companyId: string, actorUserId: string, jobId: string) {
  const { job } = await requireCollaborativeJob(companyId, actorUserId, jobId);
  await deleteDraftJob(jobId, job.status as JobStatus, companyId);
}

export async function submitCollaborativeJobForReview(companyId: string, actorUserId: string, jobId: string) {
  const { job } = await requireCollaborativeJob(companyId, actorUserId, jobId);
  return submitJobForReview(job, companyId);
}
