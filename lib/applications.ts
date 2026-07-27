import { prisma } from "@/lib/prisma";
import { Prisma } from "../prisma/generated/client";
import { ApiError } from "@/lib/api-error";
import { notifyApplicationSubmitted } from "@/lib/email";
import { applicationCreateSchema, applicationUpdateSchema } from "@/lib/validations/application";

export async function createApplication(seekerUserId: string, raw: unknown) {
  const input = applicationCreateSchema.parse(raw);

  const seeker = await prisma.seekerProfile.findUnique({
    where: { userId: seekerUserId },
    include: { user: { select: { email: true } } },
  });

  if (!seeker) {
    throw new ApiError("Seeker profile not found", 404);
  }

  if (!seeker.resumeUrl) {
    throw new ApiError("Upload a resume on your profile before applying", 400);
  }

  const now = new Date();
  const job = await prisma.job.findFirst({
    where: {
      id: input.jobId,
      status: "ACTIVE",
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    include: {
      company: {
        include: { user: { select: { id: true, email: true } } },
      },
    },
  });

  if (!job) {
    throw new ApiError("Job not found or no longer accepting applications", 404);
  }

  if (job.company.verifiedStatus !== "APPROVED") {
    throw new ApiError("This employer is not yet verified", 400);
  }

  try {
    const application = await prisma.application.create({
      data: {
        jobId: job.id,
        seekerId: seeker.id,
        coverNote: input.coverNote?.trim() || null,
      },
      include: {
        job: { select: { title: true } },
        seeker: { select: { fullName: true } },
      },
    });

    await notifyApplicationSubmitted({
      jobTitle: job.title,
      companyName: job.company.companyName,
      seekerName: seeker.fullName,
      employerUserId: job.company.user.id,
      employerEmail: job.company.user.email,
      seekerEmail: seeker.user.email,
      jobId: job.id,
    });

    return application;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new ApiError("You have already applied to this job", 409);
    }
    throw error;
  }
}

export async function updateApplication(applicationId: string, raw: unknown) {
  const data = applicationUpdateSchema.parse(raw);

  return prisma.application.update({
    where: { id: applicationId },
    data: {
      ...(data.status !== undefined ? { status: data.status } : {}),
      ...(data.internalNotes !== undefined ? { internalNotes: data.internalNotes } : {}),
      ...(data.rating !== undefined ? { rating: data.rating } : {}),
      ...(data.rejectionReason !== undefined ? { rejectionReason: data.rejectionReason } : {}),
    },
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
        },
      },
    },
  });
}

export async function listJobApplications(jobId: string) {
  return prisma.application.findMany({
    where: { jobId },
    orderBy: { appliedAt: "desc" },
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
        },
      },
    },
  });
}
