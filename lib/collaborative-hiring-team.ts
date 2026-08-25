import { prisma } from "@/lib/prisma";
import { ApplicationStatus, JobStatus } from "@prisma/client";
import { ApiError } from "@/lib/api-error";
import {
  createInvitationToken,
  hashInvitationToken,
  isCollaborativeHiringEnabled,
  requireCollaborativeHiringEnabled,
  requireCompanyMembership,
  type CompanyMemberRole,
} from "@/lib/collaborative-hiring";
import { sendCollaborativeHiringInvitation } from "@/lib/email";

const INVITATION_TTL_DAYS = 7;

/** Minimal, recipient-facing invitation data. The secret token never leaves the URL. */
export async function getCompanyInvitationPreview(token: string) {
  const invitation = await prisma.companyInvitation.findUnique({
    where: { tokenHash: hashInvitationToken(token) },
    include: { company: { select: { companyName: true, logoUrl: true } } },
  });
  if (!invitation || invitation.acceptedAt || invitation.revokedAt || invitation.expiresAt <= new Date()) {
    return null;
  }
  if (!(await isCollaborativeHiringEnabled(invitation.companyId))) return null;
  return invitation;
}

export async function listCollaborativeTeam(companyId: string, actorUserId: string) {
  await requireCompanyMembership(companyId, actorUserId, "team:read");
  const now = new Date();
  const [members, invitations, company] = await Promise.all([
    prisma.companyMember.findMany({
      where: { companyId, status: "ACTIVE" },
      include: { user: { select: { id: true, email: true } } },
      orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
    }),
    prisma.companyInvitation.findMany({
      where: { companyId, acceptedAt: null, revokedAt: null, expiresAt: { gt: now } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.company.findUnique({ where: { id: companyId }, select: { id: true, companyName: true, logoUrl: true } }),
  ]);
  if (!company) throw new ApiError("Company not found", 404);
  return { members, invitations, company };
}

/**
 * The collaborator landing screen deliberately returns only work the current
 * person may see. Hiring managers see assigned jobs; owners and recruiters
 * see the company-wide queue; viewers receive a read-only summary.
 */
export async function getCollaboratorWorkspaceOverview(companyId: string, actorUserId: string) {
  const membership = await requireCompanyMembership(companyId, actorUserId, "team:read");
  const jobScope = membership.role === "HIRING_MANAGER"
    ? { teamMembers: { some: { memberId: membership.id } } }
    : {};
  const jobWhere = {
    companyId,
    status: { in: [JobStatus.ACTIVE, JobStatus.PENDING_REVIEW] },
    ...jobScope,
  };

  const since = new Date();
  since.setDate(since.getDate() - 6);
  since.setHours(0, 0, 0, 0);
  const [jobs, submittedScorecards, activeJobs, totalApplications, upcomingInterviews, weeklyApplications] = await Promise.all([
    prisma.job.findMany({
      where: jobWhere,
      orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
      take: 8,
      select: {
        id: true,
        title: true,
        status: true,
        _count: {
          select: {
            applications: {
              where: {
                status: { in: [ApplicationStatus.APPLIED, ApplicationStatus.SHORTLISTED] },
                evaluations: { none: { memberId: membership.id, submittedAt: { not: null } } },
              },
            },
          },
        },
      },
    }),
    prisma.candidateEvaluation.count({ where: { memberId: membership.id, submittedAt: { not: null } } }),
    prisma.job.count({ where: jobWhere }),
    prisma.application.count({ where: { job: jobWhere } }),
    prisma.interview.count({ where: { application: { job: jobWhere }, scheduledAt: { gte: new Date() }, status: "SCHEDULED" } }),
    Promise.all(Array.from({ length: 7 }, (_, index) => {
      const start = new Date(since);
      start.setDate(since.getDate() + index);
      const end = new Date(start);
      end.setDate(start.getDate() + 1);
      return prisma.application.count({ where: { job: jobWhere, appliedAt: { gte: start, lt: end } } });
    })),
  ]);
  const candidatesAwaitingReview = jobs.reduce((total, job) => total + job._count.applications, 0);

  return {
    membership,
    jobs: jobs.map((job) => ({
      id: job.id,
      title: job.title,
      status: job.status,
      candidatesAwaitingReview: job._count.applications,
    })),
    assignedJobs: jobs.length,
    candidatesAwaitingReview,
    submittedScorecards,
    activeJobs,
    totalApplications,
    upcomingInterviews,
    weeklyApplications,
  };
}

export async function inviteCompanyMember(
  companyId: string,
  actorUserId: string,
  input: { email: string; role: Exclude<CompanyMemberRole, "OWNER"> }
) {
  await requireCompanyMembership(companyId, actorUserId, "team:manage");
  const company = await prisma.company.findUnique({ where: { id: companyId }, select: { companyName: true } });
  if (!company) throw new ApiError("Company not found", 404);

  const existingUser = await prisma.user.findUnique({ where: { email: input.email }, select: { id: true } });
  if (existingUser) {
    const existingMember = await prisma.companyMember.findFirst({
      where: { companyId, userId: existingUser.id, status: "ACTIVE" },
      select: { id: true },
    });
    if (existingMember) throw new ApiError("This person is already an active team member.", 409);
  }

  const { token, tokenHash } = createInvitationToken();
  const expiresAt = new Date(Date.now() + INVITATION_TTL_DAYS * 24 * 60 * 60 * 1000);
  const invitation = await prisma.$transaction(async (tx) => {
    await tx.companyInvitation.updateMany({
      where: { companyId, email: input.email, acceptedAt: null, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return tx.companyInvitation.create({
      data: { companyId, email: input.email, role: input.role, tokenHash, expiresAt, invitedBy: actorUserId },
    });
  });

  // A mail provider failure must not leak a token or create another invitation.
  await sendCollaborativeHiringInvitation({ to: input.email, companyName: company.companyName, role: input.role, token });
  return invitation;
}

export async function revokeCompanyInvitation(companyId: string, actorUserId: string, invitationId: string) {
  await requireCompanyMembership(companyId, actorUserId, "team:manage");
  const result = await prisma.companyInvitation.updateMany({
    where: { id: invitationId, companyId, acceptedAt: null, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  if (!result.count) throw new ApiError("Active invitation not found", 404);
}

export async function updateCompanyMemberRole(
  companyId: string,
  actorUserId: string,
  memberId: string,
  role: CompanyMemberRole
) {
  await requireCompanyMembership(companyId, actorUserId, "team:manage");
  const member = await prisma.companyMember.findFirst({ where: { id: memberId, companyId, status: "ACTIVE" } });
  if (!member) throw new ApiError("Active team member not found", 404);

  if (member.role === "OWNER") throw new ApiError("The company owner role cannot be changed.", 400);
  if (role === "OWNER") throw new ApiError("Only the company owner can hold the owner role.", 400);
  return prisma.companyMember.update({ where: { id: member.id }, data: { role } });
}

export async function removeCompanyMember(companyId: string, actorUserId: string, memberId: string) {
  await requireCompanyMembership(companyId, actorUserId, "team:manage");
  const member = await prisma.companyMember.findFirst({ where: { id: memberId, companyId, status: "ACTIVE" } });
  if (!member) throw new ApiError("Active team member not found", 404);
  if (member.userId === actorUserId) throw new ApiError("Owners cannot remove themselves from the team.", 400);
  if (member.role === "OWNER") {
    const owners = await prisma.companyMember.count({ where: { companyId, status: "ACTIVE", role: "OWNER" } });
    if (owners <= 1) throw new ApiError("A company must retain at least one owner.", 400);
  }
  await prisma.companyMember.update({ where: { id: member.id }, data: { status: "REMOVED" } });
}

export async function acceptCompanyInvitation(token: string, userId: string, userEmail: string | null | undefined) {
  const invitation = await prisma.companyInvitation.findUnique({ where: { tokenHash: hashInvitationToken(token) } });
  if (!invitation || invitation.acceptedAt || invitation.revokedAt || invitation.expiresAt <= new Date()) {
    throw new ApiError("This invitation is invalid, expired, or has already been used.", 400);
  }
  if (!userEmail || userEmail.toLowerCase() !== invitation.email.toLowerCase()) {
    throw new ApiError("Sign in with the email address that received this invitation.", 403);
  }
  await requireCollaborativeHiringEnabled(invitation.companyId);

  return prisma.$transaction(async (tx) => {
    const fresh = await tx.companyInvitation.findUnique({ where: { id: invitation.id } });
    if (!fresh || fresh.acceptedAt || fresh.revokedAt || fresh.expiresAt <= new Date()) {
      throw new ApiError("This invitation is no longer available.", 400);
    }
    await tx.companyMember.upsert({
      where: { companyId_userId: { companyId: fresh.companyId, userId } },
      create: { companyId: fresh.companyId, userId, role: fresh.role, status: "ACTIVE", invitedBy: fresh.invitedBy },
      update: { role: fresh.role, status: "ACTIVE", invitedBy: fresh.invitedBy, joinedAt: new Date() },
    });
    return tx.companyInvitation.update({ where: { id: fresh.id }, data: { acceptedAt: new Date() } });
  });
}
