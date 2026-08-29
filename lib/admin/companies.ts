import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";
import { adminCompanyReviewSchema } from "@/lib/validations/admin";
import { invalidateCollaborativeHiringEnabled } from "@/lib/collaborative-hiring";
import { VERIFICATION_DOC_BUCKET, resolveSignedUrl } from "@/lib/storage";

export async function listPendingCompanies() {
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

export async function reviewCompany(companyId: string, raw: unknown) {
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
    ]);

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
  ]);

  return updated;
}
