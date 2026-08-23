import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { companyInputToData, companyUpdateSchema } from "@/lib/validations/company";

/** Creates a draft company when an employer user has no row (partial signup / Google). */
export async function ensureEmployerCompany(
  userId: string,
  defaults: { companyName?: string } = {}
) {
  const existing = await prisma.company.findUnique({ where: { userId } });
  if (existing) return existing;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new Error(`Cannot create company: user ${userId} not found`);
  }

  try {
    return await prisma.company.create({
      data: {
        userId,
        companyName: defaults.companyName?.trim() || "",
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return prisma.company.findUniqueOrThrow({ where: { userId } });
    }
    throw error;
  }
}

export async function updateCompany(userId: string, raw: unknown) {
  const input = companyUpdateSchema.parse(raw);

  return prisma.company.update({
    where: { userId },
    data: companyInputToData(input),
  });
}

export async function getEmployerCompanyProfile(companyId: string) {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: {
      verificationDocuments: { orderBy: { uploadedAt: "desc" } },
    },
  });

  if (!company) return null;

  const [activeJobsCount, totalApplicantsCount] = await Promise.all([
    prisma.job.count({ where: { companyId: company.id, status: "ACTIVE" } }),
    prisma.application.count({ where: { job: { companyId: company.id } } }),
  ]);

  return { company, activeJobsCount, totalApplicantsCount };
}
