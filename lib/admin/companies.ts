import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";
import { adminCompanyReviewSchema } from "@/lib/validations/admin";

export async function listPendingCompanies() {
  return prisma.company.findMany({
    where: { verifiedStatus: "PENDING" },
    orderBy: { updatedAt: "asc" },
    include: {
      user: { select: { email: true } },
      jobs: {
        where: { status: { in: ["ACTIVE", "PENDING_REVIEW"] } },
        select: { id: true, title: true, status: true },
        orderBy: { updatedAt: "desc" },
      },
      _count: { select: { jobs: true } },
    },
  });
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
        data: { verifiedStatus: "APPROVED" },
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
      data: { verifiedStatus: "REJECTED" },
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
