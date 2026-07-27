import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";

export async function getPublicCompany(companyId: string) {
  const now = new Date();

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: {
      jobs: {
        where: {
          status: "ACTIVE",
          OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        },
        orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
        select: {
          id: true,
          title: true,
          category: true,
          employmentType: true,
          remoteType: true,
          location: true,
          salaryMin: true,
          salaryMax: true,
          publishedAt: true,
        },
      },
    },
  });

  if (!company) {
    throw new ApiError("Company not found", 404);
  }

  return company;
}
