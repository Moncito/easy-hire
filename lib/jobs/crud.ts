import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";
import { requireVerifiedEmail } from "@/lib/auth/credentials-recovery";
import { jobInputSchema, jobInputToData, type JobInput } from "@/lib/validations/job";
import {
  assertEmployerStatusTransition,
  type JobStatus,
} from "@/lib/job-status";
import { canAutoPublishJob, publishJobLive } from "@/lib/subscriptions";
import { invalidateEmployerWorkspace } from "@/lib/employer-cache";
import { canCreateOrActivateJob } from "@/lib/billing/entitlements";
import { invalidatePublicJob, invalidatePublicJobsList } from "@/lib/jobs/public-cache";
import { invalidatePublicCompany } from "@/lib/public-companies";

const SUBMITTABLE_STATUSES: JobStatus[] = ["DRAFT", "PENDING_REVIEW"];

function screeningQuestionsCreateData(questions: JobInput["screeningQuestions"]) {
  return (questions ?? []).map((q, index) => ({
    prompt: q.prompt.trim(),
    required: q.required ?? true,
    sortOrder: index,
  }));
}

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
  // Drafts don't occupy a soft-cap slot — the cap is enforced at submit time
  // (see submitJobForReview) so employers can always draft freely.
  const input = jobInputSchema.parse(raw);
  const job = await prisma.job.create({
    data: {
      companyId,
      ...jobInputToData(input),
      status: "DRAFT",
      screeningQuestions: {
        create: screeningQuestionsCreateData(input.screeningQuestions),
      },
    },
    include: {
      screeningQuestions: { orderBy: { sortOrder: "asc" } },
    },
  });
  invalidateEmployerWorkspace(companyId);
  invalidatePublicJobsList();
  invalidatePublicCompany(companyId);
  return job;
}

export async function updateJob(
  jobId: string,
  existingStatus: JobStatus,
  raw: unknown,
  companyId?: string
) {
  const input = jobInputSchema.parse(raw);
  let newStatus = existingStatus;

  if (existingStatus === "ACTIVE") {
    const autoPublish = companyId ? await canAutoPublishJob(companyId) : false;
    newStatus = autoPublish ? "ACTIVE" : "PENDING_REVIEW";
  }

  const updated = await prisma.$transaction(async (tx) => {
    await tx.screeningQuestion.deleteMany({ where: { jobId } });

    return tx.job.update({
      where: { id: jobId },
      data: {
        ...jobInputToData(input),
        status: newStatus,
        screeningQuestions: {
          create: screeningQuestionsCreateData(input.screeningQuestions),
        },
      },
      include: {
        screeningQuestions: { orderBy: { sortOrder: "asc" } },
      },
    });
  });

  if (companyId) invalidateEmployerWorkspace(companyId);
  invalidatePublicJobsList();
  invalidatePublicJob(jobId);
  if (companyId) invalidatePublicCompany(companyId);
  return updated;
}

export async function updateJobStatus(
  jobId: string,
  status: JobStatus,
  currentStatus: JobStatus,
  companyId?: string
) {
  assertEmployerStatusTransition(currentStatus, status);

  const updated = await prisma.job.update({
    where: { id: jobId },
    data: { status },
  });

  const resolvedCompanyId =
    companyId ??
    (await prisma.job.findUnique({ where: { id: jobId }, select: { companyId: true } }))?.companyId;

  if (resolvedCompanyId) invalidateEmployerWorkspace(resolvedCompanyId);
  invalidatePublicJobsList();
  invalidatePublicJob(jobId);
  if (resolvedCompanyId) invalidatePublicCompany(resolvedCompanyId);
  return updated;
}

export async function deleteDraftJob(jobId: string, currentStatus: JobStatus, companyId: string) {
  if (currentStatus !== "DRAFT") {
    throw new ApiError("Only draft jobs can be deleted. Close live listings instead.", 400);
  }

  await prisma.job.delete({ where: { id: jobId } });
  invalidateEmployerWorkspace(companyId);
  invalidatePublicJobsList();
  invalidatePublicJob(jobId);
  invalidatePublicCompany(companyId);
}

export async function submitJobForReview(
  job: {
    id: string;
    status: JobStatus;
    title: string;
    description: string;
    category: string;
    location: string;
  },
  companyId: string,
  userId: string
) {
  // Posting a job is one of the two gated actions (see requireVerifiedEmail) —
  // an unverified employer can still draft, just not put a job in front of seekers.
  await requireVerifiedEmail(userId);

  if (!SUBMITTABLE_STATUSES.includes(job.status)) {
    throw new ApiError("Only draft or pending jobs can be submitted for review", 400);
  }

  if (!job.title || !job.description || !job.category || !job.location) {
    throw new ApiError("Complete all required fields before submitting for review", 400);
  }

  // Free plan: block once a company already has FREE_ACTIVE_JOB_SOFT_CAP jobs
  // live or pending review. Exclude this job itself so re-submitting a job
  // that's already PENDING_REVIEW doesn't double-count against the cap.
  const cap = await canCreateOrActivateJob(companyId, { excludeJobId: job.id });
  if (!cap.allowed) {
    throw new ApiError(cap.reason!, 403);
  }

  const autoPublish = await canAutoPublishJob(companyId);
  const updated = autoPublish
    ? await publishJobLive(job.id)
    : await prisma.job.update({
        where: { id: job.id },
        data: {
          status: "PENDING_REVIEW",
          reviewRejectionReason: null,
        },
      });

  invalidateEmployerWorkspace(companyId);
  invalidatePublicJobsList();
  invalidatePublicJob(job.id);
  invalidatePublicCompany(companyId);
  return updated;
}

export function parseJobInput(raw: unknown) {
  return jobInputSchema.parse(raw);
}
