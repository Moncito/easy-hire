import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";

export const getEmployerCompanyCached = cache(async (userId: string) => {
  return prisma.company.findUnique({
    where: { userId },
  });
});

export async function requireEmployerCompany(userId: string) {
  const company = await getEmployerCompanyCached(userId);

  if (!company) {
    throw new ApiError("Company not found", 404);
  }

  return company;
}

export async function requireEmployerJob(userId: string, jobId: string) {
  const company = await requireEmployerCompany(userId);
  const job = await prisma.job.findFirst({
    where: { id: jobId, companyId: company.id },
    include: {
      screeningQuestions: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!job) {
    throw new ApiError("Job not found", 404);
  }

  return { company, job };
}

export async function requireEmployerApplication(userId: string, applicationId: string) {
  const company = await requireEmployerCompany(userId);
  const application = await prisma.application.findFirst({
    where: { id: applicationId, job: { companyId: company.id } },
    include: {
      seeker: {
        select: {
          id: true,
          fullName: true,
          headline: true,
          skills: true,
          resumeUrl: true,
          location: true,
          desiredSalaryMin: true,
          desiredSalaryMax: true,
          linkedinUrl: true,
          portfolioUrl: true,
          certifications: true,
          photoUrl: true,
        },
      },
      answers: {
        include: {
          question: { select: { id: true, prompt: true, required: true, sortOrder: true } },
        },
        orderBy: { question: { sortOrder: "asc" } },
      },
    },
  });

  if (!application) {
    throw new ApiError("Application not found", 404);
  }

  return { company, application };
}
