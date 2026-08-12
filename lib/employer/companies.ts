import { prisma } from "@/lib/prisma";
import { companyInputToData, companyUpdateSchema } from "@/lib/validations/company";

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
