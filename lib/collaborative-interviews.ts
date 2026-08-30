import { CompanyMemberRole, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";
import { hasCollaborativePermission, requireCompanyMembership } from "@/lib/collaborative-hiring";
import { notifyInterviewCancelled, notifyInterviewRescheduled, notifyInterviewScheduled } from "@/lib/email";
import { invalidateSeekerInterviews } from "@/lib/seeker/cache";

type InterviewLifecycleRecord = {
  applicationId: string;
  scheduledAt: Date;
  durationMins: number;
  format: string;
  location: string | null;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * The candidate-facing email context (job title, company name, the
 * company's contact email as calendar organizer, and the seeker's own
 * identity) for one application. Deliberately only reads what an interview
 * email needs — never touches InterviewParticipant.notes/outcome or
 * CandidateEvaluation, which are employer-private.
 */
async function loadInterviewEmailContext(applicationId: string) {
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    select: {
      job: {
        select: {
          title: true,
          company: { select: { companyName: true, user: { select: { email: true } } } },
        },
      },
      seeker: {
        select: { fullName: true, user: { select: { id: true, email: true } } },
      },
    },
  });
  if (!application) return null;
  return {
    jobTitle: application.job.title,
    companyName: application.job.company.companyName,
    organizerEmail: application.job.company.user.email,
    seekerUserId: application.seeker.user.id,
    seekerEmail: application.seeker.user.email,
    seekerName: application.seeker.fullName,
  };
}

/**
 * iCalendar SEQUENCE has no dedicated column on Interview (schema changes are
 * out of scope for this task — flagged as a follow-up: a persisted
 * `icsSequence` counter would make this exact across 3+ reschedules).
 * Instead this derives a monotonically non-decreasing value from
 * createdAt/updatedAt: 0 for a never-touched interview, 1 once it has been
 * updated at least once. Reschedule and cancel add their own offsets on top
 * so a cancellation's SEQUENCE is always higher than any reschedule that
 * could have preceded it.
 */
function priorIcsSequence(record: Pick<InterviewLifecycleRecord, "createdAt" | "updatedAt">): number {
  return record.updatedAt.getTime() > record.createdAt.getTime() ? 1 : 0;
}

function notifyScheduled(interview: InterviewLifecycleRecord & { id: string }) {
  return (async () => {
    const ctx = await loadInterviewEmailContext(interview.applicationId);
    if (!ctx) return;
    invalidateSeekerInterviews(ctx.seekerUserId);
    await notifyInterviewScheduled({
      interviewId: interview.id,
      seekerUserId: ctx.seekerUserId,
      seekerEmail: ctx.seekerEmail,
      seekerName: ctx.seekerName,
      jobTitle: ctx.jobTitle,
      companyName: ctx.companyName,
      scheduledAt: interview.scheduledAt,
      durationMins: interview.durationMins,
      format: interview.format,
      location: interview.location,
      organizerEmail: ctx.organizerEmail,
      sequence: 0,
    });
  })();
}

function notifyRescheduled(
  interview: InterviewLifecycleRecord & { id: string },
  previousScheduledAt: Date,
  priorRecord: Pick<InterviewLifecycleRecord, "createdAt" | "updatedAt">
) {
  return (async () => {
    const ctx = await loadInterviewEmailContext(interview.applicationId);
    if (!ctx) return;
    invalidateSeekerInterviews(ctx.seekerUserId);
    await notifyInterviewRescheduled({
      interviewId: interview.id,
      seekerUserId: ctx.seekerUserId,
      seekerEmail: ctx.seekerEmail,
      seekerName: ctx.seekerName,
      jobTitle: ctx.jobTitle,
      companyName: ctx.companyName,
      scheduledAt: interview.scheduledAt,
      previousScheduledAt,
      durationMins: interview.durationMins,
      format: interview.format,
      location: interview.location,
      organizerEmail: ctx.organizerEmail,
      sequence: priorIcsSequence(priorRecord) + 1,
    });
  })();
}

function notifyCancelled(
  interview: InterviewLifecycleRecord & { id: string },
  priorRecord: Pick<InterviewLifecycleRecord, "createdAt" | "updatedAt">
) {
  return (async () => {
    const ctx = await loadInterviewEmailContext(interview.applicationId);
    if (!ctx) return;
    invalidateSeekerInterviews(ctx.seekerUserId);
    await notifyInterviewCancelled({
      interviewId: interview.id,
      seekerUserId: ctx.seekerUserId,
      seekerEmail: ctx.seekerEmail,
      seekerName: ctx.seekerName,
      jobTitle: ctx.jobTitle,
      companyName: ctx.companyName,
      scheduledAt: interview.scheduledAt,
      durationMins: interview.durationMins,
      format: interview.format,
      location: interview.location,
      organizerEmail: ctx.organizerEmail,
      sequence: priorIcsSequence(priorRecord) + 2,
    });
  })();
}

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
  let interview;
  try {
    interview = await prisma.$transaction(async (tx) => {
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

  // The candidate notification/email is a side effect of a successful
  // schedule, never a precondition for it — a Resend outage must not fail
  // the employer's request (mirrors app/api/register/route.ts's
  // fire-and-forget verification email).
  notifyScheduled(interview).catch((err) =>
    console.error("[collaborative-interviews] failed to notify candidate of scheduled interview:", err)
  );

  return interview;
}

/**
 * Changes an existing SCHEDULED interview's time in place — same Interview
 * row/id, so the calendar UID stays stable and the candidate's calendar app
 * updates the existing entry instead of gaining a duplicate. Distinct from
 * scheduling a second interview round (a new Interview row), which
 * scheduleInterview already supports.
 */
export async function rescheduleInterview(companyId: string, userId: string, jobId: string, applicationId: string, interviewId: string, input: { scheduledAt: string }) {
  const { membership } = await context(companyId, userId, jobId, applicationId);
  if (!(hasCollaborativePermission(membership.role, "interviews:manage") || hasCollaborativePermission(membership.role, "interviews:participate"))) throw new ApiError("You cannot reschedule interviews.", 403);
  const date = new Date(input.scheduledAt);
  if (Number.isNaN(date.valueOf())) throw new ApiError("Choose a valid interview time.", 400);

  const existing = await prisma.interview.findFirst({
    where: { id: interviewId, applicationId },
    select: { id: true, status: true, scheduledAt: true, durationMins: true, format: true, location: true, createdAt: true, updatedAt: true, applicationId: true },
  });
  if (!existing) throw new ApiError("Interview not found", 404);
  if (existing.status !== "SCHEDULED") throw new ApiError("Only a scheduled interview can be rescheduled.", 400);

  let updated;
  try {
    updated = await prisma.$transaction(async (tx) => {
      const duplicate = await tx.interview.findFirst({ where: { applicationId, scheduledAt: date, status: "SCHEDULED", NOT: { id: interviewId } }, select: { id: true } });
      if (duplicate) throw new ApiError("An interview is already scheduled for this time.", 409);
      return tx.interview.update({ where: { id: interviewId }, data: { scheduledAt: date } });
    }, { isolationLevel: "Serializable" });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new ApiError("An interview is already scheduled for this time.", 409);
    }
    throw error;
  }

  notifyRescheduled(updated, existing.scheduledAt, existing).catch((err) =>
    console.error("[collaborative-interviews] failed to notify candidate of rescheduled interview:", err)
  );

  return updated;
}

export async function cancelCollaborativeInterview(companyId: string, actorUserId: string, jobId: string, applicationId: string, interviewId: string) {
  const { membership } = await context(companyId, actorUserId, jobId, applicationId);
  if (!(hasCollaborativePermission(membership.role, "interviews:manage") || hasCollaborativePermission(membership.role, "interviews:participate"))) throw new ApiError("You cannot cancel interviews.", 403);
  const interview = await prisma.interview.findFirst({
    where: { id: interviewId, applicationId },
    select: { id: true, status: true, scheduledAt: true, durationMins: true, format: true, location: true, createdAt: true, updatedAt: true, applicationId: true },
  });
  if (!interview) throw new ApiError("Interview not found", 404);
  if (interview.status === "CANCELLED") throw new ApiError("This interview is already cancelled.", 400);
  const updated = await prisma.interview.update({ where: { id: interview.id }, data: { status: "CANCELLED" } });

  notifyCancelled(updated, interview).catch((err) =>
    console.error("[collaborative-interviews] failed to notify candidate of cancelled interview:", err)
  );

  return updated;
}

export async function saveInterviewNotes(companyId: string, userId: string, jobId: string, applicationId: string, interviewId: string, input: { notes?: string; outcome?: string; completed?: boolean }) {
  const { membership } = await context(companyId, userId, jobId, applicationId);
  const participant = await prisma.interviewParticipant.findFirst({ where: { interviewId, memberId: membership.id, interview: { applicationId } } });
  if (!participant) throw new ApiError("You are not assigned to this interview.", 403);
  return prisma.interviewParticipant.update({ where: { id: participant.id }, data: { notes: input.notes ?? null, outcome: input.outcome ?? null, completedAt: input.completed ? new Date() : null } });
}
