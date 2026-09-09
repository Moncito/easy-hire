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
import { recordEvent } from "@/lib/admin/events";

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

  // No userId is available here (only companyId) in either call site
  // (app/api/jobs/route.ts and the collaborative-hiring wrapper) — the
  // entityId is enough to attribute this to the job/company.
  recordEvent({
    eventType: "JOB_CREATED",
    actorType: "EMPLOYER",
    entityType: "JOB",
    entityId: job.id,
    metadata: { companyId },
  });

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

  let entersPendingReview = false;
  if (existingStatus === "ACTIVE") {
    const autoPublish = companyId ? await canAutoPublishJob(companyId) : false;
    newStatus = autoPublish ? "ACTIVE" : "PENDING_REVIEW";
    entersPendingReview = !autoPublish;
  }

  const updated = await prisma.$transaction(async (tx) => {
    await tx.screeningQuestion.deleteMany({ where: { jobId } });

    return tx.job.update({
      where: { id: jobId },
      data: {
        ...jobInputToData(input),
        status: newStatus,
        // Edit-and-resubmit: an ACTIVE job edited by an employer without
        // auto-publish drops back to PENDING_REVIEW here, so this is a
        // second PENDING_REVIEW entry point alongside submitJobForReview
        // below — restamp for the same "new review clock" reason documented
        // on Job.pendingReviewAt in prisma/schema.prisma.
        ...(entersPendingReview ? { pendingReviewAt: new Date() } : {}),
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

  // The employer-facing PATCH route only ever targets CLOSED (see
  // lib/jobs/status.ts's EMPLOYER_ALLOWED map — ACTIVE is never a target
  // here), so this is the one JOB_CLOSED call site.
  if (status === "CLOSED" && currentStatus !== "CLOSED") {
    recordEvent({
      eventType: "JOB_CLOSED",
      actorType: "EMPLOYER",
      entityType: "JOB",
      entityId: jobId,
    });
  }

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
          // Restamp on every entry into PENDING_REVIEW, including a
          // resubmit after rejection (job.status can already be
          // PENDING_REVIEW here per SUBMITTABLE_STATUSES) — see the "new
          // review clock" reasoning on Job.pendingReviewAt in
          // prisma/schema.prisma.
          pendingReviewAt: new Date(),
        },
      });

  invalidateEmployerWorkspace(companyId);
  invalidatePublicJobsList();
  invalidatePublicJob(job.id);
  invalidatePublicCompany(companyId);

  recordEvent({
    eventType: "JOB_SUBMITTED",
    actorType: "EMPLOYER",
    userId,
    entityType: "JOB",
    entityId: job.id,
  });

  if (autoPublish) {
    recordEvent({
      eventType: "JOB_PUBLISHED",
      actorType: "EMPLOYER",
      userId,
      entityType: "JOB",
      entityId: job.id,
    });
  }

  return updated;
}

export function parseJobInput(raw: unknown) {
  return jobInputSchema.parse(raw);
}
