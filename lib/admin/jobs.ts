import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { ApiError } from "@/lib/api-error";
import { adminJobReviewSchema } from "@/lib/validations/admin";
import { invalidateEmployerWorkspace } from "@/lib/employer-cache";
import { invalidatePublicJob, invalidatePublicJobsList } from "@/lib/jobs/public-cache";
import { invalidatePublicCompany } from "@/lib/public-companies";
import { sendJobApprovedEmail, sendJobRejectedEmail } from "@/lib/shared/email";

const JOB_LISTING_DAYS = 90;

export async function listPendingJobs() {
  return prisma.job.findMany({
    where: { status: "PENDING_REVIEW" },
    orderBy: { updatedAt: "asc" },
    include: {
      company: {
        select: {
          id: true,
          companyName: true,
          industry: true,
          verifiedStatus: true,
          userId: true,
        },
      },
    },
  });
}

export async function reviewJob(jobId: string, raw: unknown) {
  const input = adminJobReviewSchema.parse(raw);

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      company: {
        select: {
          userId: true,
          companyName: true,
          verifiedStatus: true,
          user: { select: { email: true } },
        },
      },
    },
  });

  if (!job) {
    throw new ApiError("Job not found", 404);
  }

  if (job.status !== "PENDING_REVIEW") {
    throw new ApiError("Only jobs pending review can be approved or rejected", 400);
  }

  if (input.action === "approve") {
    if (job.company.verifiedStatus !== "APPROVED") {
      throw new ApiError(
        "Verify the employer company before approving this job. Review them at Admin → Company verifications.",
        400
      );
    }

    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + JOB_LISTING_DAYS);

    const [updated] = await prisma.$transaction([
      prisma.job.update({
        where: { id: jobId },
        data: {
          status: "ACTIVE",
          publishedAt: now,
          expiresAt,
        },
      }),
      prisma.notification.create({
        data: {
          userId: job.company.userId,
          type: "JOB_APPROVED",
          message: `Your job "${job.title}" is now live on the public job board.`,
        },
      }),
    ]);

    invalidateEmployerWorkspace(job.companyId);
    invalidatePublicJobsList();
    invalidatePublicJob(jobId);
    invalidatePublicCompany(job.companyId);

    void sendJobApprovedEmail({
      to: job.company.user.email,
      companyName: job.company.companyName,
      jobTitle: job.title,
    }).catch((err) => console.error("[admin/jobs] approved email failed:", err));

    return updated;
  }

  const reason = input.reason?.trim() || "Please review your posting and submit again.";

  const [updated] = await prisma.$transaction([
    prisma.job.update({
      where: { id: jobId },
      data: {
        status: "DRAFT",
        reviewRejectionReason: reason,
      },
    }),
    prisma.notification.create({
      data: {
        userId: job.company.userId,
        type: "JOB_REJECTED",
        message: `Your job "${job.title}" was not approved: ${reason}`,
      },
    }),
  ]);

  invalidateEmployerWorkspace(job.companyId);

  void sendJobRejectedEmail({
    to: job.company.user.email,
    companyName: job.company.companyName,
    jobTitle: job.title,
    reason,
  }).catch((err) => console.error("[admin/jobs] rejected email failed:", err));

  return updated;
}
