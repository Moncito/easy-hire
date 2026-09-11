import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";
import { adminCompanyReviewSchema } from "@/lib/validations/admin";
import { invalidateCollaborativeHiringEnabled } from "@/lib/collaborative-hiring";
import { VERIFICATION_DOC_BUCKET, resolveSignedUrl } from "@/lib/storage";
import { sendCompanyRejectedEmail, sendCompanyVerifiedEmail } from "@/lib/shared/email";
import { buildAdminActionOperation, recordPiiRead } from "@/lib/admin/audit";
import { requireAdminPermission } from "@/lib/admin/permissions";
import { getCompanyPlan, type SubscriptionPlan } from "@/lib/billing/subscriptions";
import type { CompanyMemberRole, CompanyMemberStatus, VerificationStatus } from "@prisma/client";

/**
 * Gated on `document.view` (docs/ADMIN-CONSOLE-PLAN.md §6.7/§8.1) because
 * this list embeds every pending company's signed verification-document
 * URLs directly in the payload — same PII-exposure shape as
 * `getQueueItemDetail` in lib/admin/queue-detail.ts, which checks the same
 * permission for the identical reason.
 */
export async function listPendingCompanies(adminUserId: string) {
  await requireAdminPermission(adminUserId, "document.view");

  const companies = await prisma.company.findMany({
    where: { verifiedStatus: "PENDING" },
    orderBy: { updatedAt: "asc" },
    include: {
      user: { select: { email: true } },
      jobs: {
        where: { status: { in: ["ACTIVE", "PENDING_REVIEW"] } },
        select: { id: true, title: true, status: true },
        orderBy: { updatedAt: "desc" },
      },
      verificationDocuments: {
        orderBy: { uploadedAt: "desc" },
      },
      _count: { select: { jobs: true } },
    },
  });

  // Admin review queue renders each document's fileUrl as a direct link —
  // sign them all up front, batched (never sequentially) across companies.
  return Promise.all(
    companies.map(async (company) => ({
      ...company,
      verificationDocuments: await Promise.all(
        company.verificationDocuments.map(async (doc) => ({
          ...doc,
          fileUrl: (await resolveSignedUrl(VERIFICATION_DOC_BUCKET, doc.fileUrl)) ?? "",
        }))
      ),
    }))
  );
}

export async function listCompaniesForCollaborativeHiring() {
  return prisma.company.findMany({
    select: { id: true, companyName: true, collaborativeHiringEnabled: true, user: { select: { email: true } } },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });
}

export async function setCollaborativeHiringEnabled(companyId: string, enabled: boolean) {
  const company = await prisma.company.update({
    where: { id: companyId },
    data: { collaborativeHiringEnabled: enabled },
    select: { id: true, collaborativeHiringEnabled: true },
  }).catch(() => null);
  if (!company) throw new ApiError("Company not found", 404);
  invalidateCollaborativeHiringEnabled(companyId);
  return company;
}

export async function reviewCompany(adminUserId: string, companyId: string, raw: unknown) {
  // Gated at the /lib layer, not only the route (§8.1) — this is the one
  // function both the single-item PATCH route AND lib/admin/bulk.ts's
  // bulkReviewQueueItems dispatch into, so gating here covers both callers.
  await requireAdminPermission(adminUserId, "queue.decide");

  const input = adminCompanyReviewSchema.parse(raw);

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: {
      user: { select: { id: true, email: true } },
      jobs: { where: { status: "ACTIVE" }, select: { id: true, title: true } },
    },
  });

  if (!company) {
    throw new ApiError("Company not found", 404);
  }

  if (company.verifiedStatus !== "PENDING") {
    throw new ApiError("Only companies pending review can be approved or rejected", 400);
  }

  if (input.action === "approve") {
    const [updated] = await prisma.$transaction([
      prisma.company.update({
        where: { id: companyId },
        data: { verifiedStatus: "APPROVED", verificationRejectionReason: null },
      }),
      prisma.notification.create({
        data: {
          userId: company.user.id,
          type: "COMPANY_APPROVED",
          message: `Your company "${company.companyName}" is verified. Approved job listings are now visible on the public board.`,
        },
      }),
      buildAdminActionOperation({
        adminUserId,
        action: "COMPANY_APPROVE",
        targetType: "COMPANY",
        targetId: companyId,
        before: { verifiedStatus: "PENDING" },
        after: { verifiedStatus: "APPROVED" },
      }),
    ]);

    void sendCompanyVerifiedEmail({
      to: company.user.email,
      companyName: company.companyName,
    }).catch((err) => console.error("[admin/companies] verified email failed:", err));

    return updated;
  }

  const reason = input.reason?.trim() || "Please update your company profile and contact support if you have questions.";

  const activeJobIds = company.jobs.map((job) => job.id);

  const [updated] = await prisma.$transaction([
    prisma.company.update({
      where: { id: companyId },
      data: { verifiedStatus: "REJECTED", verificationRejectionReason: reason },
    }),
    ...(activeJobIds.length
      ? [
          prisma.job.updateMany({
            where: { id: { in: activeJobIds } },
            data: { status: "CLOSED" },
          }),
        ]
      : []),
    prisma.notification.create({
      data: {
        userId: company.user.id,
        type: "COMPANY_REJECTED",
        message: `Your company "${company.companyName}" was not verified: ${reason}`,
      },
    }),
    buildAdminActionOperation({
      adminUserId,
      action: "COMPANY_REJECT",
      targetType: "COMPANY",
      targetId: companyId,
      reasonCode: input.reasonCode,
      note: reason,
      before: { verifiedStatus: "PENDING" },
      after: { verifiedStatus: "REJECTED" },
    }),
  ]);

  void sendCompanyRejectedEmail({
    to: company.user.email,
    companyName: company.companyName,
    reason,
  }).catch((err) => console.error("[admin/companies] rejected email failed:", err));

  return updated;
}

// ============================================================================
// COMPANY DETAIL — GET /api/admin/companies/[id] (docs/ADMIN-CONSOLE-PLAN.md
// §4.3 / §3: "plan, spend, jobs, members, risk"). A single-target PII read,
// same category as lib/admin/users.ts's getUserRecord — writes
// COMPANY_RECORD_VIEWED via recordPiiRead (a read, not a decision; see that
// helper's doc comment in lib/admin/audit.ts).
//
// Every count/aggregate below is scoped to exactly ONE company id — no
// per-row query over jobs/members/AI events, matching §10's "counts, not
// unbounded lists" and the no-N+1 rule.
// ============================================================================

export type CompanyDetailMember = {
  id: string;
  userId: string;
  email: string;
  role: CompanyMemberRole;
  status: CompanyMemberStatus;
  joinedAt: Date;
};

export type CompanyDetail = {
  companyId: string;
  companyName: string;
  email: string;
  industry: string | null;
  website: string | null;
  verifiedStatus: VerificationStatus;
  verificationRejectionReason: string | null;
  createdAt: Date;
  trustScore: number | null;
  trustScoreUpdatedAt: Date | null;
  plan: SubscriptionPlan;
  jobCounts: { active: number; pendingReview: number; closed: number; draft: number; total: number };
  members: CompanyDetailMember[];
  responseRate: number | null;
  medianResponseMinutes: number | null;
  responseSampleSize: number | null;
  aiSpend: { totalCostMicroCents: number; callCount: number };
  riskSignals: {
    reportsAgainstCount: number;
    /** `AdminAuditLog` JOB_REJECT rows in the trailing 90 days for this company's jobs — same window/definition as `TRUST_WEIGHTS.employer.jobRejections` in lib/admin/trust.ts, read here rather than recomputed. */
    jobRejections90dCount: number;
  };
};

type JobRejectionCountRow = { rejections: number };

export async function getCompanyDetail(adminUserId: string, companyId: string): Promise<CompanyDetail> {
  await requireAdminPermission(adminUserId, "user.read");

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: {
      id: true,
      companyName: true,
      industry: true,
      website: true,
      verifiedStatus: true,
      verificationRejectionReason: true,
      createdAt: true,
      trustScore: true,
      trustScoreUpdatedAt: true,
      responseRate: true,
      medianResponseMinutes: true,
      responseSampleSize: true,
      user: { select: { email: true } },
      members: {
        where: { status: "ACTIVE" },
        select: { id: true, userId: true, role: true, status: true, joinedAt: true, user: { select: { email: true } } },
        orderBy: { joinedAt: "asc" },
      },
    },
  });

  if (!company) {
    throw new ApiError("Company not found", 404);
  }

  const [plan, statusGroups, aiAgg, reportsAgainstCount, jobRejectionRows] = await Promise.all([
    getCompanyPlan(companyId),
    prisma.job.groupBy({ by: ["status"], where: { companyId }, _count: { _all: true } }),
    prisma.aiUsageEvent.aggregate({ where: { companyId }, _sum: { costMicroCents: true }, _count: { _all: true } }),
    prisma.abuseReport.count({ where: { targetType: "COMPANY", targetId: companyId } }),
    // Joins through Job (AdminAuditLog.targetId is a job id, not a company
    // id — see lib/admin/jobs.ts's reviewJob) — same shape as the raw query
    // lib/admin/trust.ts's recomputeEmployerTrustScoresBatch runs in bulk
    // across many companies, scoped here to just this one.
    prisma.$queryRaw<JobRejectionCountRow[]>`
      SELECT COUNT(*)::int AS rejections
      FROM admin_audit_logs aal
      JOIN jobs j ON j.id = aal.target_id
      WHERE aal.action = 'JOB_REJECT'
        AND aal.target_type = 'JOB'
        AND aal.created_at >= now() - interval '90 days'
        AND j.company_id = ${companyId}
    `,
  ]);

  const countByStatus = new Map<string, number>(statusGroups.map((r) => [r.status, r._count._all]));
  const jobCounts = {
    active: countByStatus.get("ACTIVE") ?? 0,
    pendingReview: countByStatus.get("PENDING_REVIEW") ?? 0,
    closed: countByStatus.get("CLOSED") ?? 0,
    draft: countByStatus.get("DRAFT") ?? 0,
    total: statusGroups.reduce((sum, r) => sum + r._count._all, 0),
  };

  recordPiiRead(adminUserId, "COMPANY_RECORD_VIEWED", "COMPANY", companyId);

  return {
    companyId: company.id,
    companyName: company.companyName,
    email: company.user.email,
    industry: company.industry,
    website: company.website,
    verifiedStatus: company.verifiedStatus,
    verificationRejectionReason: company.verificationRejectionReason,
    createdAt: company.createdAt,
    trustScore: company.trustScore,
    trustScoreUpdatedAt: company.trustScoreUpdatedAt,
    plan,
    jobCounts,
    members: company.members.map((m) => ({
      id: m.id,
      userId: m.userId,
      email: m.user.email,
      role: m.role,
      status: m.status,
      joinedAt: m.joinedAt,
    })),
    responseRate: company.responseRate,
    medianResponseMinutes: company.medianResponseMinutes,
    responseSampleSize: company.responseSampleSize,
    aiSpend: {
      totalCostMicroCents: aiAgg._sum.costMicroCents ?? 0,
      callCount: aiAgg._count._all,
    },
    riskSignals: {
      reportsAgainstCount,
      jobRejections90dCount: jobRejectionRows[0]?.rejections ?? 0,
    },
  };
}
