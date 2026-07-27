import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";
import { jobInputSchema, jobInputToData } from "@/lib/validations/job";

type JobStatus = "DRAFT" | "PENDING_REVIEW" | "ACTIVE" | "CLOSED";

const SUBMITTABLE_STATUSES: JobStatus[] = ["DRAFT", "PENDING_REVIEW"];

export async function listEmployerJobs(companyId: string) {
  return prisma.job.findMany({
    where: { companyId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { applications: true } },
    },
  });
}

export async function createJob(companyId: string, raw: unknown) {
  const input = jobInputSchema.parse(raw);
  return prisma.job.create({
    data: {
      companyId,
      ...jobInputToData(input),
      status: "DRAFT",
    },
  });
}

export async function updateJob(jobId: string, existingStatus: JobStatus, raw: unknown) {
  const input = jobInputSchema.parse(raw);
  const newStatus = existingStatus === "ACTIVE" ? "PENDING_REVIEW" : existingStatus;

  return prisma.job.update({
    where: { id: jobId },
    data: {
      ...jobInputToData(input),
      status: newStatus,
    },
  });
}

export async function updateJobStatus(jobId: string, status: JobStatus) {
  return prisma.job.update({
    where: { id: jobId },
    data: { status },
  });
}

export async function submitJobForReview(job: {
  id: string;
  status: JobStatus;
  title: string;
  description: string;
  category: string;
  location: string;
}) {
  if (!SUBMITTABLE_STATUSES.includes(job.status)) {
    throw new ApiError("Only draft or pending jobs can be submitted for review", 400);
  }

  if (!job.title || !job.description || !job.category || !job.location) {
    throw new ApiError("Complete all required fields before submitting for review", 400);
  }

  return prisma.job.update({
    where: { id: job.id },
    data: { status: "PENDING_REVIEW" },
  });
}

export function parseJobInput(raw: unknown) {
  return jobInputSchema.parse(raw);
}
