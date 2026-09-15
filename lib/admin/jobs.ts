import { prisma } from "@/lib/prisma";
import { Prisma, type JobStatus, type SalaryPeriod } from "@prisma/client";
import { ApiError } from "@/lib/api-error";
import { adminJobReviewSchema } from "@/lib/validations/admin";
import { invalidateEmployerWorkspace } from "@/lib/employer-cache";
import { invalidatePublicJob, invalidatePublicJobsList } from "@/lib/jobs/public-cache";
import { invalidatePublicCompany } from "@/lib/public-companies";
import { sendJobApprovedEmail, sendJobRejectedEmail } from "@/lib/shared/email";
import { buildAdminActionOperation } from "@/lib/admin/audit";
import { recordEvent } from "@/lib/admin/events";
import { requireAdminPermission } from "@/lib/admin/permissions";
import type { QueueCursor } from "@/lib/admin/queues";

const JOB_LISTING_DAYS = 90;

export async function listPendingJobs(adminUserId: string) {
  await requireAdminPermission(adminUserId, "queue.decide");

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

export async function reviewJob(adminUserId: string, jobId: string, raw: unknown) {
  // Gated here, not only at the route (§8.1) — reviewJob is also the
  // dispatch target for lib/admin/bulk.ts's bulkReviewQueueItems.
  await requireAdminPermission(adminUserId, "queue.decide");

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
      buildAdminActionOperation({
        adminUserId,
        action: "JOB_APPROVE",
        targetType: "JOB",
        targetId: jobId,
        before: { status: "PENDING_REVIEW" },
        after: { status: "ACTIVE" },
      }),
    ]);

    invalidateEmployerWorkspace(job.companyId);
    invalidatePublicJobsList();
    invalidatePublicJob(jobId);
    invalidatePublicCompany(job.companyId);

    recordEvent({
      eventType: "JOB_PUBLISHED",
      actorType: "ADMIN",
      userId: adminUserId,
      entityType: "JOB",
      entityId: jobId,
    });

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
    buildAdminActionOperation({
      adminUserId,
      action: "JOB_REJECT",
      targetType: "JOB",
      targetId: jobId,
      reasonCode: input.reasonCode,
      note: reason,
      before: { status: "PENDING_REVIEW" },
      after: { status: "DRAFT" },
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

// ============================================================================
// JOB DIRECTORY — GET /api/admin/jobs/directory (docs/ADMIN-CONSOLE-PLAN.md
// §3: "/admin/jobs — all jobs, any status"). Deliberately distinct from
// `listQueue({ kind: "JOB" })` in lib/admin/queues.ts, which only ever
// surfaces the moderation subset (PENDING_REVIEW / ACTIVE / rejected-DRAFT)
// for risk-ranked review. This is a plain, cursor-paginated, all-status
// browse — no ranking, no severity signals, so it's a much simpler query.
//
// Cursor reuses `QueueCursor`/`encodeQueueCursor`/`decodeQueueCursor` from
// lib/admin/queues.ts as-is (docs/ADMIN-CONSOLE-PLAN.md §10: "follow the
// established cursor pattern rather than inventing a second one") — the
// shape is identical, (updatedAt, id), just walked in the opposite direction
// (newest-updated first, since this is a browse screen, not a work queue
// that wants oldest-first for SLA purposes).
// ============================================================================

export type JobDirectoryItem = {
  id: string;
  title: string;
  companyId: string;
  companyName: string;
  category: string;
  status: JobStatus;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryPeriod: SalaryPeriod;
  updatedAt: Date;
  publishedAt: Date | null;
};

export type JobDirectoryListResult = { items: JobDirectoryItem[]; nextCursor: QueueCursor | null };

const DEFAULT_JOB_DIRECTORY_LIMIT = 25;
const MAX_JOB_DIRECTORY_LIMIT = 100;

/**
 * NOT gated with an `adminUserId` parameter here, unlike most other
 * lib/admin/* reads in this module — `app/admin/jobs/directory/page.tsx`
 * (a Server Component, out of scope for this backend task per CLAUDE.md's
 * subagent split) calls this directly with no admin id in hand beyond what
 * `requireAdminPageContext` already checked (Role.ADMIN only). Adding a
 * required permission check here would break that call site's build.
 * `GET /api/admin/jobs/directory` (the route also backed by this function)
 * IS gated with `requireAdminWithPermission(..., "queue.decide")` — see
 * app/api/admin/jobs/directory/route.ts. Threading the finer-grained
 * permission into the RSC page's initial render is follow-up UI work, not
 * a backend change; flagged in this task's handoff report.
 */
export async function listJobDirectory(params: {
  status?: JobStatus;
  search?: string;
  cursor?: QueueCursor;
  limit?: number;
}): Promise<JobDirectoryListResult> {
  const limit = Math.min(Math.max(params.limit ?? DEFAULT_JOB_DIRECTORY_LIMIT, 1), MAX_JOB_DIRECTORY_LIMIT);

  // Each condition group is its own array slot, combined with `AND` — never
  // two separate `{ OR: [...] }` object-spreads into one literal, which
  // silently drops all but the last on key collision (see the identical note
  // in lib/admin/users.ts's listUserDirectory).
  const and: Prisma.JobWhereInput[] = [];

  if (params.status) {
    and.push({ status: params.status });
  }

  if (params.search) {
    and.push({
      OR: [
        { title: { contains: params.search, mode: "insensitive" } },
        { category: { contains: params.search, mode: "insensitive" } },
        { company: { companyName: { contains: params.search, mode: "insensitive" } } },
      ],
    });
  }

  if (params.cursor) {
    and.push({
      OR: [
        { updatedAt: { lt: params.cursor.updatedAt } },
        { updatedAt: params.cursor.updatedAt, id: { lt: params.cursor.id } },
      ],
    });
  }

  const rows = await prisma.job.findMany({
    where: and.length > 0 ? { AND: and } : undefined,
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    take: limit + 1,
    select: {
      id: true,
      title: true,
      companyId: true,
      category: true,
      status: true,
      salaryMin: true,
      salaryMax: true,
      salaryPeriod: true,
      updatedAt: true,
      publishedAt: true,
      company: { select: { companyName: true } },
    },
  });

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const last = page[page.length - 1];
  const nextCursor = hasMore && last ? { updatedAt: last.updatedAt, id: last.id } : null;

  const items: JobDirectoryItem[] = page.map((row) => ({
    id: row.id,
    title: row.title,
    companyId: row.companyId,
    companyName: row.company.companyName,
    category: row.category,
    status: row.status,
    salaryMin: row.salaryMin,
    salaryMax: row.salaryMax,
    salaryPeriod: row.salaryPeriod,
    updatedAt: row.updatedAt,
    publishedAt: row.publishedAt,
  }));

  return { items, nextCursor };
}
