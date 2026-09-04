import { ApplicationStatus, CompanyMemberRole, EvaluationRecommendation, JobStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";
import { hasCollaborativePermission, requireCompanyMembership } from "@/lib/collaborative-hiring";
import { signResumeUrl } from "@/lib/seeker/resume-urls";
import { isFirstEmployerResponseTransition } from "@/lib/employer/response-metrics";
import type { z } from "zod";
import type { collaborativePipelineSchema, collaborativeScorecardSchema } from "@/lib/validations/collaborative-review";

type ScorecardInput = z.infer<typeof collaborativeScorecardSchema>;
type PipelineInput = z.infer<typeof collaborativePipelineSchema>;

async function requireCollaborativeJobAccess(companyId: string, actorUserId: string, jobId: string) {
  const membership = await requireCompanyMembership(companyId, actorUserId, "team:read");
  const job = await prisma.job.findFirst({
    where: { id: jobId, companyId },
    select: { id: true, title: true, status: true, teamMembers: { where: { memberId: membership.id }, select: { id: true } } },
  });
  if (!job) throw new ApiError("Job not found", 404);
  if (membership.role === CompanyMemberRole.HIRING_MANAGER && job.teamMembers.length === 0) {
    throw new ApiError("You are not assigned to this role.", 403);
  }
  return { membership, job };
}

export async function getCollaborativeReviewQueue(companyId: string, actorUserId: string, jobId: string) {
  const { membership, job } = await requireCollaborativeJobAccess(companyId, actorUserId, jobId);
  const canScore = hasCollaborativePermission(membership.role, "scorecards:manage") || hasCollaborativePermission(membership.role, "scorecards:own");
  const [template, applications] = await Promise.all([
    prisma.scorecardTemplate.findFirst({ where: { jobId, isActive: true }, select: { id: true, title: true, criteria: { orderBy: { sortOrder: "asc" }, select: { id: true, label: true } } } }),
    prisma.application.findMany({
      where: { jobId, status: { not: ApplicationStatus.REJECTED } },
      orderBy: [{ status: "asc" }, { appliedAt: "desc" }],
      select: {
        id: true, status: true, appliedAt: true,
        seeker: { select: { fullName: true, headline: true, photoUrl: true, skills: true } },
        evaluations: { where: { memberId: membership.id }, select: { submittedAt: true, updatedAt: true } },
      },
    }),
  ]);
  return {
    membership: { role: membership.role },
    job: { id: job.id, title: job.title, status: job.status },
    template,
    canScore,
    applications: applications.map((application) => ({
      ...application,
      appliedAt: application.appliedAt.toISOString(),
      evaluationState: application.evaluations[0]?.submittedAt ? "SUBMITTED" : application.evaluations[0] ? "DRAFT" : "NOT_STARTED",
    })),
  };
}

export async function getCollaborativeCandidateReview(companyId: string, actorUserId: string, jobId: string, applicationId: string) {
  const { membership, job } = await requireCollaborativeJobAccess(companyId, actorUserId, jobId);
  const canScore = hasCollaborativePermission(membership.role, "scorecards:manage") || hasCollaborativePermission(membership.role, "scorecards:own");
  const [template, application, activities] = await Promise.all([
    prisma.scorecardTemplate.findFirst({ where: { jobId, isActive: true }, include: { criteria: { orderBy: { sortOrder: "asc" } } } }),
    prisma.application.findFirst({
      where: { id: applicationId, jobId },
      include: {
        seeker: {
          select: {
            fullName: true, headline: true, photoUrl: true, location: true, skills: true, yearsExperience: true,
            resumeUrl: true, resumeLabel: true, resumeUpdatedAt: true, phone: true, availability: true,
            desiredSalaryMin: true, desiredSalaryMax: true,
            user: { select: { email: true } },
          },
        },
        answers: { include: { question: { select: { prompt: true, sortOrder: true } } }, orderBy: { question: { sortOrder: "asc" } } },
        evaluations: {
          where: { OR: [{ memberId: membership.id }, { submittedAt: { not: null } }] },
          include: { member: { include: { user: { select: { email: true } } } }, ratings: { include: { criterion: { select: { id: true, label: true } } } } },
          orderBy: { submittedAt: "desc" },
        },
      },
    }),
    prisma.applicationActivity.findMany({
      where: { applicationId },
      include: { actorMember: { include: { user: { select: { email: true } } } } },
      orderBy: { createdAt: "asc" },
    }),
  ]);
  if (!application) throw new ApiError("Candidate application not found", 404);
  application.seeker.resumeUrl = await signResumeUrl(application.seeker.resumeUrl);
  const ownEvaluation = application.evaluations.find((evaluation) => evaluation.memberId === membership.id) ?? null;
  // Hiring managers review independently: they do not see peers' feedback
  // until they have committed their own scorecard. Recruiters/owners retain
  // visibility so they can coordinate the hiring decision.
  const feedbackLocked = membership.role === CompanyMemberRole.HIRING_MANAGER && !ownEvaluation?.submittedAt;
  const submittedReviews = feedbackLocked ? [] : application.evaluations.filter((evaluation) => evaluation.submittedAt && evaluation.memberId !== membership.id);
  const canAddActivity = canMoveCollaborativeCandidate(membership.role);
  return { job: { id: job.id, title: job.title }, membership: { id: membership.id, role: membership.role }, canScore, canMove: canMoveCollaborativeCandidate(membership.role), canSchedule: hasCollaborativePermission(membership.role, "interviews:manage"), canAddActivity, feedbackLocked, template, application, ownEvaluation, submittedReviews, activities };
}

export async function addApplicationActivityNote(companyId: string, actorUserId: string, jobId: string, applicationId: string, body: string) {
  const { membership } = await requireCollaborativeJobAccess(companyId, actorUserId, jobId);
  if (!canMoveCollaborativeCandidate(membership.role)) throw new ApiError("You do not have permission to add notes on this candidate.", 403);
  const application = await prisma.application.findFirst({ where: { id: applicationId, jobId }, select: { id: true } });
  if (!application) throw new ApiError("Candidate application not found", 404);
  return prisma.applicationActivity.create({
    data: { applicationId, type: "NOTE", body, actorMemberId: membership.id },
    include: { actorMember: { include: { user: { select: { email: true } } } } },
  });
}

export async function saveCollaborativeCandidateEvaluation(companyId: string, actorUserId: string, jobId: string, applicationId: string, input: ScorecardInput) {
  const { membership } = await requireCollaborativeJobAccess(companyId, actorUserId, jobId);
  if (!(hasCollaborativePermission(membership.role, "scorecards:manage") || hasCollaborativePermission(membership.role, "scorecards:own"))) {
    throw new ApiError("You do not have permission to submit a scorecard.", 403);
  }
  const [template, application] = await Promise.all([
    prisma.scorecardTemplate.findFirst({ where: { jobId, isActive: true }, include: { criteria: { select: { id: true } } } }),
    prisma.application.findFirst({ where: { id: applicationId, jobId }, select: { id: true } }),
  ]);
  if (!template) throw new ApiError("This role does not have a scorecard yet.", 400);
  if (!application) throw new ApiError("Candidate application not found", 404);
  const scoreIds = input.scores.map((score) => score.criterionId);
  if (new Set(scoreIds).size !== scoreIds.length || scoreIds.some((id) => !template.criteria.some((criterion) => criterion.id === id))) {
    throw new ApiError("The scorecard contains an invalid criterion.", 400);
  }
  if (input.submit && (input.scores.length !== template.criteria.length || !input.recommendation)) {
    throw new ApiError("Rate every criterion and choose a recommendation before submitting.", 400);
  }

  const saved = await prisma.$transaction(async (tx) => {
    const current = await tx.candidateEvaluation.findUnique({ where: { applicationId_memberId: { applicationId, memberId: membership.id } } });
    if (current?.submittedAt) throw new ApiError("Submitted scorecards cannot be changed.", 400);
    const evaluation = current
      ? await tx.candidateEvaluation.update({ where: { id: current.id }, data: { templateId: template.id, summary: input.summary || null, recommendation: input.recommendation as EvaluationRecommendation | null, submittedAt: input.submit ? new Date() : null } })
      : await tx.candidateEvaluation.create({ data: { applicationId, memberId: membership.id, templateId: template.id, summary: input.summary || null, recommendation: input.recommendation as EvaluationRecommendation | null, submittedAt: input.submit ? new Date() : null } });
    await tx.evaluationRating.deleteMany({ where: { evaluationId: evaluation.id } });
    if (input.scores.length) await tx.evaluationRating.createMany({ data: input.scores.map((score) => ({ evaluationId: evaluation.id, criterionId: score.criterionId, score: score.score })) });
    return tx.candidateEvaluation.findUniqueOrThrow({ where: { id: evaluation.id }, include: { ratings: true } });
  });
  if (input.submit) {
    const [application, assignees] = await Promise.all([
      prisma.application.findUnique({ where: { id: applicationId }, select: { seeker: { select: { fullName: true } }, job: { select: { title: true } } } }),
      prisma.jobTeamMember.findMany({ where: { jobId }, select: { member: { select: { userId: true } } } }),
    ]);
    const recipients = [...new Set(assignees.map((assignment) => assignment.member.userId).filter((userId) => userId !== actorUserId))];
    if (application && recipients.length) await prisma.notification.createMany({ data: recipients.map((userId) => ({ userId, type: "SCORECARD_SUBMITTED", message: `A scorecard was submitted for ${application.seeker.fullName} · ${application.job.title}.` })) });
  }
  return saved;
}

export async function updateCollaborativePipeline(companyId: string, actorUserId: string, jobId: string, applicationId: string, input: PipelineInput) {
  const { membership } = await requireCollaborativeJobAccess(companyId, actorUserId, jobId);
    if (!(hasCollaborativePermission(membership.role, "applicants:manage") || hasCollaborativePermission(membership.role, "applicants:assigned"))) throw new ApiError("You do not have permission to move candidates.", 403);
  const application = await prisma.application.findFirst({ where: { id: applicationId, jobId }, select: { id: true, status: true, firstEmployerResponseAt: true } });
  if (!application) throw new ApiError("Candidate application not found", 404);
  // Site 2 of 3 for Application.firstEmployerResponseAt (see its schema
  // comment): the collaborative-hiring workspace's STAGE_CHANGE path.
  const becameResponded = isFirstEmployerResponseTransition(
    application.status,
    input.status,
    Boolean(application.firstEmployerResponseAt)
  );
  const [updated] = await prisma.$transaction([
    prisma.application.update({
      where: { id: application.id },
      data: {
        status: input.status,
        rejectionReason: input.status === "REJECTED" ? input.rejectionReason ?? null : null,
        ...(becameResponded ? { firstEmployerResponseAt: new Date() } : {}),
      },
      select: { id: true, status: true, rejectionReason: true, updatedAt: true },
    }),
    prisma.applicationActivity.create({ data: { applicationId, type: "STAGE_CHANGE", body: `${application.status} → ${input.status}`, actorMemberId: membership.id } }),
  ]);
  return updated;
}

export function canMoveCollaborativeCandidate(role: CompanyMemberRole) {
  return hasCollaborativePermission(role, "applicants:manage") || hasCollaborativePermission(role, "applicants:assigned");
}
