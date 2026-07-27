import { prisma } from "@/lib/prisma";
import { companyInputToData, companyUpdateSchema } from "@/lib/validations/company";

export async function updateCompany(userId: string, raw: unknown) {
  const input = companyUpdateSchema.parse(raw);

  return prisma.company.update({
    where: { userId },
    data: companyInputToData(input),
  });
}
