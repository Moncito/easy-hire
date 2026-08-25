import { CompanyMemberRole, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";
import { hasCollaborativePermission, requireCompanyMembership } from "@/lib/collaborative-hiring";

/**
 * Interviews calendar across every role the caller may access. Hiring
 * managers see only interviews on jobs they're assigned to, same scoping as
 * the workspace overview (lib/collaborative-hiring-team.ts).
 */
export async function listCompanyInterviews(companyId: string, actorUserId: string) {
  const membership = await requireCompanyMembership(companyId, actorUserId, "team:read");
  const jobScope = membership.role === CompanyMemberRole.HIRING_MANAGER
    ? { teamMembers: { some: { memberId: membership.id } } }
    : {};
  return prisma.interview.findMany({
    where: { application: { job: { companyId, ...jobScope } }, status: "SCHEDULED", scheduledAt: { gte: new Date() } },
    orderBy: { scheduledAt: "asc" },
    take: 50,
    select: {
      id: true,
      scheduledAt: true,
      durationMins: true,
      format: true,
      location: true,
      status: true,
      application: { select: { id: true, job: { select: { id: true, title: true } }, seeker: { select: { fullName: true, photoUrl: true } } } },
      participants: { select: { member: { select: { user: { select: { email: true } } } } } },
    },
  });
}

async function context(companyId: string, userId: string, jobId: string, applicationId: string) {
  const membership = await requireCompanyMembership(companyId, userId, "team:read");
  const application = await prisma.application.findFirst({ where: { id: applicationId, jobId, job: { companyId } }, select: { id: true } });
  if (!application) throw new ApiError("Candidate application not found", 404);
  return { membership, application };
}

export async function listInterviews(companyId: string, userId: string, jobId: string, applicationId: string) {
  const { membership } = await context(companyId, userId, jobId, applicationId);
  return prisma.interview.findMany({ where: { applicationId }, orderBy: { scheduledAt: "asc" }, include: { participants: { include: { member: { include: { user: { select: { email: true } } } } } } } });
}

export async function scheduleInterview(companyId: string, userId: string, jobId: string, applicationId: string, input: { scheduledAt: string; durationMins: number; format: string; location?: string; memberIds: string[] }) {
  const { membership } = await context(companyId, userId, jobId, applicationId);
  if (!(hasCollaborativePermission(membership.role, "interviews:manage") || hasCollaborativePermission(membership.role, "interviews:participate"))) throw new ApiError("You cannot schedule interviews.", 403);
  const date = new Date(input.scheduledAt); if (Number.isNaN(date.valueOf())) throw new ApiError("Choose a valid interview time.", 400);
  const members = await prisma.companyMember.findMany({ where: { companyId, id: { in: input.memberIds }, status: "ACTIVE" }, select: { id: true } });
  if (members.length !== new Set(input.memberIds).size) throw new ApiError("An interviewer is no longer on this team.", 400);
  // Scheduling is a user action that is easy to double-submit (double-clicks,
  // slow networks, or a retried request). This app-level pre-check is a cheap
  // early exit with a friendly message; the partial unique index on
  // interviews(application_id, scheduled_at) WHERE status = 'SCHEDULED' (see
  // prisma/migrations/20260825000000_interview_slot_unique_when_scheduled) is
  // the authoritative guarantee against duplicates under concurrent requests.
  try {
    return await prisma.$transaction(async (tx) => {
      const duplicate = await tx.interview.findFirst({ where: { applicationId, scheduledAt: date, status: "SCHEDULED" }, select: { id: true } });
      if (duplicate) throw new ApiError("An interview is already scheduled for this time.", 409);
      return tx.interview.create({ data: { applicationId, scheduledAt: date, durationMins: Math.max(15, Math.min(input.durationMins, 240)), format: input.format || "VIDEO", location: input.location || null, createdBy: userId, participants: { create: members.map((member) => ({ memberId: member.id })) } }, include: { participants: true } });
    }, { isolationLevel: "Serializable" });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new ApiError("An interview is already scheduled for this time.", 409);
    }
    throw error;
  }
}

export async function cancelCollaborativeInterview(companyId: string, actorUserId: string, jobId: string, applicationId: string, interviewId: string) {
  const { membership } = await context(companyId, actorUserId, jobId, applicationId);
  if (!(hasCollaborativePermission(membership.role, "interviews:manage") || hasCollaborativePermission(membership.role, "interviews:participate"))) throw new ApiError("You cannot cancel interviews.", 403);
  const interview = await prisma.interview.findFirst({ where: { id: interviewId, applicationId }, select: { id: true, status: true } });
  if (!interview) throw new ApiError("Interview not found", 404);
  if (interview.status === "CANCELLED") throw new ApiError("This interview is already cancelled.", 400);
  return prisma.interview.update({ where: { id: interview.id }, data: { status: "CANCELLED" } });
}

export async function saveInterviewNotes(companyId: string, userId: string, jobId: string, applicationId: string, interviewId: string, input: { notes?: string; outcome?: string; completed?: boolean }) {
  const { membership } = await context(companyId, userId, jobId, applicationId);
  const participant = await prisma.interviewParticipant.findFirst({ where: { interviewId, memberId: membership.id, interview: { applicationId } } });
  if (!participant) throw new ApiError("You are not assigned to this interview.", 403);
  return prisma.interviewParticipant.update({ where: { id: participant.id }, data: { notes: input.notes ?? null, outcome: input.outcome ?? null, completedAt: input.completed ? new Date() : null } });
}
