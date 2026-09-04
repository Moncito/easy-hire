import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { ApiError } from "@/lib/api-error";
import {
  notifyApplicationSubmitted,
  notifyApplicationRejected,
  notifyApplicationStatusChanged,
  createNotification,
  type NonRejectionApplicationStatus,
} from "@/lib/email";
import { applicationCreateSchema, applicationUpdateSchema } from "@/lib/validations/application";
import { invalidateEmployerWorkspace } from "@/lib/employer-cache";
import { invalidateSeekerApplications } from "@/lib/seeker/cache";
import { hydrateResumeFields } from "@/lib/seeker/resume-urls";
import { recomputeVerificationScore } from "@/lib/seeker/identity-verification";
import { isFirstEmployerResponseTransition } from "@/lib/employer/response-metrics";

const candidateSeekerSelect = {
  id: true,
  fullName: true,
  headline: true,
  skills: true,
  resumeUrl: true,
  resumeLabel: true,
  resumeUpdatedAt: true,
  resumes: true,
  location: true,
  desiredSalaryMin: true,
  desiredSalaryMax: true,
  availability: true,
  yearsExperience: true,
  languages: true,
  education: true,
  linkedinUrl: true,
  portfolioUrl: true,
  certifications: true,
  photoUrl: true,
} as const;

async function normalizeCandidateSeeker<
  T extends {
    skills?: string[] | null;
    languages?: string[] | null;
    education?: string[] | null;
    resumeUrl?: string | null;
    resumes?: string[] | null;
    resumeUpdatedAt?: Date | null;
  },
>(seeker: T) {
  const normalized = {
    ...seeker,
    skills: seeker.skills ?? [],
    languages: seeker.languages ?? [],
    education: seeker.education ?? [],
    resumes: seeker.resumes ?? [],
    resumeUpdatedAt: seeker.resumeUpdatedAt?.toISOString() ?? null,
  };
  return hydrateResumeFields(normalized);
}

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
      screeningQuestions: true,
    },
  });

  if (!job) {
    throw new ApiError("Job not found or no longer accepting applications", 404);
  }

  if (job.company.verifiedStatus !== "APPROVED") {
    throw new ApiError("This employer is not yet verified", 400);
  }

  // Screening answers are collected for the employer's context only —
  // required questions must be answered, but content never triggers auto-rejection.
  const answerByQuestionId = new Map(input.answers.map((a) => [a.questionId, a.answerText]));
  const missingRequired = job.screeningQuestions.some(
    (q) => q.required && !answerByQuestionId.get(q.id)?.trim()
  );
  if (missingRequired) {
    throw new ApiError("Please answer all required screening questions", 400);
  }

  const validQuestionIds = new Set(job.screeningQuestions.map((q) => q.id));
  const answersToCreate = input.answers.filter(
    (a) => validQuestionIds.has(a.questionId) && a.answerText.trim().length > 0
  );

  try {
    const application = await prisma.$transaction(async (tx) => {
      const created = await tx.application.create({
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

      if (answersToCreate.length > 0) {
        await tx.applicationAnswer.createMany({
          data: answersToCreate.map((a) => ({
            applicationId: created.id,
            questionId: a.questionId,
            answerText: a.answerText.trim(),
          })),
        });
      }

      return created;
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

    invalidateEmployerWorkspace(job.companyId);
    invalidateSeekerApplications(seekerUserId);
    return application;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new ApiError("You have already applied to this job", 409);
    }
    throw error;
  }
}

const WITHDRAWABLE = new Set(["APPLIED"]);

export async function withdrawApplication(seekerUserId: string, applicationId: string) {
  const seeker = await prisma.seekerProfile.findUnique({
    where: { userId: seekerUserId },
    select: { id: true, fullName: true },
  });
  if (!seeker) {
    throw new ApiError("Seeker profile not found", 404);
  }

  const application = await prisma.application.findFirst({
    where: { id: applicationId, seekerId: seeker.id },
    include: {
      job: {
        select: {
          id: true,
          title: true,
          company: { select: { id: true, userId: true } },
        },
      },
    },
  });

  if (!application) {
    throw new ApiError("Application not found", 404);
  }

  if (!WITHDRAWABLE.has(application.status)) {
    throw new ApiError(
      "You can only withdraw an application before the employer moves it forward",
      400
    );
  }

  await prisma.application.delete({ where: { id: application.id } });

  await createNotification(
    application.job.company.userId,
    "APPLICATION_WITHDRAWN",
    `${seeker.fullName} withdrew their application to "${application.job.title}".`
  );
  invalidateEmployerWorkspace(application.job.company.id);
  invalidateSeekerApplications(seekerUserId);

  return { ok: true as const, jobId: application.job.id };
}

export async function updateApplication(applicationId: string, raw: unknown) {
  const data = applicationUpdateSchema.parse(raw);

  const existing = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      seeker: {
        include: {
          user: { select: { id: true, email: true } },
        },
      },
      job: {
        include: {
          company: { select: { companyName: true, id: true } },
        },
      },
    },
  });

  if (!existing) {
    throw new ApiError("Application not found", 404);
  }

  // Stamp once, the first time this application transitions into HIRED —
  // never overwritten on a later re-hire (see the Application.hiredAt schema
  // comment). This anchors the two-way review window (lib/reviews.ts).
  const becameHired = data.status === "HIRED" && existing.status !== "HIRED" && !existing.hiredAt;

  // Site 1 of 3 for Application.firstEmployerResponseAt (see its schema
  // comment): the plain (non-collaborative) employer flow moving an
  // application off APPLIED. Stamp-once via isFirstEmployerResponseTransition
  // — never overwritten on a later status change.
  const becameResponded = isFirstEmployerResponseTransition(
    existing.status,
    data.status,
    Boolean(existing.firstEmployerResponseAt)
  );

  const updated = await prisma.application.update({
    where: { id: applicationId },
    data: {
      ...(data.status !== undefined ? { status: data.status } : {}),
      ...(data.internalNotes !== undefined ? { internalNotes: data.internalNotes } : {}),
      ...(data.rating !== undefined ? { rating: data.rating } : {}),
      ...(data.rejectionReason !== undefined ? { rejectionReason: data.rejectionReason } : {}),
      ...(becameHired ? { hiredAt: new Date() } : {}),
      ...(becameResponded ? { firstEmployerResponseAt: new Date() } : {}),
    },
    include: {
      seeker: {
        select: candidateSeekerSelect,
      },
    },
  });

  const becameRejected = data.status === "REJECTED" && existing.status !== "REJECTED";
  const NON_REJECTION_STATUSES = new Set(["SHORTLISTED", "INTERVIEW", "HIRED"]);
  const becameOtherStatus =
    data.status !== undefined &&
    data.status !== existing.status &&
    NON_REJECTION_STATUSES.has(data.status);

  if (becameRejected) {
    void notifyApplicationRejected({
      seekerUserId: existing.seeker.user.id,
      seekerEmail: existing.seeker.user.email,
      seekerName: existing.seeker.fullName,
      jobTitle: existing.job.title,
      companyName: existing.job.company.companyName,
      rejectionReason: data.rejectionReason ?? updated.rejectionReason ?? null,
    }).catch((err) => console.error("[applications] rejection notify failed:", err));
  } else if (becameOtherStatus) {
    void notifyApplicationStatusChanged({
      seekerUserId: existing.seeker.user.id,
      seekerEmail: existing.seeker.user.email,
      seekerName: existing.seeker.fullName,
      jobTitle: existing.job.title,
      companyName: existing.job.company.companyName,
      status: data.status as NonRejectionApplicationStatus,
    }).catch((err) => console.error("[applications] status-change notify failed:", err));
  }

  if (becameHired) {
    // A confirmed hire feeds the "history" factor of the verification score
    // (see lib/seeker/verification-score.ts). Fire-and-forget: must never
    // block the hiring transition.
    void recomputeVerificationScore(existing.seekerId).catch((err) =>
      console.error("[applications] verification score recompute failed:", err)
    );
  }

  invalidateEmployerWorkspace(existing.job.company.id);
  invalidateSeekerApplications(existing.seeker.user.id);
  return {
    ...updated,
    seeker: await normalizeCandidateSeeker(updated.seeker),
  };
}

export async function listJobApplications(jobId: string, page = 1, pageSize = 50) {
  const skip = (page - 1) * pageSize;

  const [applications, total] = await Promise.all([
    prisma.application.findMany({
      where: { jobId },
      orderBy: { appliedAt: "desc" },
      skip,
      take: pageSize,
      include: {
        seeker: {
          select: candidateSeekerSelect,
        },
        answers: {
          include: {
            question: { select: { id: true, prompt: true, required: true, sortOrder: true } },
          },
          orderBy: { question: { sortOrder: "asc" } },
        },
      },
    }),
    prisma.application.count({ where: { jobId } }),
  ]);

  const hydratedApplications = await Promise.all(
    applications.map(async (application) => ({
      ...application,
      seeker: await normalizeCandidateSeeker(application.seeker),
    }))
  );

  return {
    applications: hydratedApplications,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}
