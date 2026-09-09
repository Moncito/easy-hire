import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { companyInputToData, companyUpdateSchema } from "@/lib/validations/company";
import { VERIFICATION_DOC_BUCKET, resolveSignedUrl } from "@/lib/storage";
import { recordEvent } from "@/lib/admin/events";

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
    const created = await prisma.company.create({
      data: {
        userId,
        companyName: defaults.companyName?.trim() || "",
      },
    });
    recordEvent({
      eventType: "COMPANY_CREATED",
      actorType: "EMPLOYER",
      userId,
      entityType: "COMPANY",
      entityId: created.id,
    });
    return created;
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

  const updated = await prisma.company.update({
    where: { userId },
    data: companyInputToData(input),
  });

  recordEvent({
    eventType: "COMPANY_UPDATED",
    actorType: "EMPLOYER",
    userId,
    entityType: "COMPANY",
    entityId: updated.id,
  });

  return updated;
}

export async function getEmployerCompanyProfile(companyId: string) {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: {
      verificationDocuments: { orderBy: { uploadedAt: "desc" } },
    },
  });

  if (!company) return null;

  const [activeJobsCount, totalApplicantsCount, verificationDocuments] = await Promise.all([
    prisma.job.count({ where: { companyId: company.id, status: "ACTIVE" } }),
    prisma.application.count({ where: { job: { companyId: company.id } } }),
    Promise.all(
      company.verificationDocuments.map(async (doc) => ({
        ...doc,
        fileUrl: (await resolveSignedUrl(VERIFICATION_DOC_BUCKET, doc.fileUrl)) ?? "",
      }))
    ),
  ]);

  return { company: { ...company, verificationDocuments }, activeJobsCount, totalApplicantsCount };
}
