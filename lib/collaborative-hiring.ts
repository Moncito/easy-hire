import { createHash, randomBytes } from "crypto";
import { CompanyMemberRole, CompanyMemberStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";
import { isEmployerPro } from "@/lib/billing/subscriptions";

export { CompanyMemberRole, CompanyMemberStatus };

export const COMPANY_ROLE_PERMISSIONS = {
  OWNER: ["company:manage", "jobs:manage", "applicants:manage", "scorecards:manage", "interviews:manage", "messages:manage", "team:read", "team:manage"],
  RECRUITER: ["company:read", "jobs:manage", "applicants:manage", "scorecards:manage", "interviews:manage", "messages:manage", "team:read"],
  HIRING_MANAGER: ["company:read", "jobs:assigned", "applicants:assigned", "scorecards:own", "interviews:participate", "team:read"],
  VIEWER: ["company:read", "jobs:read", "applicants:read", "scorecards:read", "interviews:read", "team:read"],
} as const satisfies Record<CompanyMemberRole, readonly string[]>;

export type CollaborativePermission = (typeof COMPANY_ROLE_PERMISSIONS)[CompanyMemberRole][number];

export function hasCollaborativePermission(role: CompanyMemberRole, permission: string) {
  return (COMPANY_ROLE_PERMISSIONS[role] as readonly string[]).includes(permission);
}

/**
 * Employer Pro includes Collaborative Hiring. The explicit company flag remains
 * available for a Free-company pilot without granting unrelated Pro features.
 */
export async function isCollaborativeHiringEnabled(companyId: string): Promise<boolean> {
  const [company, pro] = await Promise.all([
    prisma.company.findUnique({
    where: { id: companyId },
    select: { collaborativeHiringEnabled: true },
    }),
    isEmployerPro(companyId),
  ]);
  return pro || company?.collaborativeHiringEnabled === true;
}

export async function requireCollaborativeHiringEnabled(companyId: string) {
  if (!(await isCollaborativeHiringEnabled(companyId))) {
    throw new ApiError("Collaborative Hiring is not enabled for this company.", 403);
  }
}

/** Keeps pre-existing company owners usable even if a deployment has not run the backfill yet. */
export async function ensureCompanyOwnerMembership(companyId: string) {
  const company = await prisma.company.findUnique({ where: { id: companyId }, select: { userId: true } });
  if (!company) throw new ApiError("Company not found", 404);

  return prisma.companyMember.upsert({
    where: { companyId_userId: { companyId, userId: company.userId } },
    create: { companyId, userId: company.userId, role: "OWNER", status: "ACTIVE" },
    update: {},
  });
}

export async function getActiveCompanyMembership(companyId: string, userId: string) {
  await ensureCompanyOwnerMembership(companyId);
  return prisma.companyMember.findFirst({ where: { companyId, userId, status: "ACTIVE" } });
}

/** All company workspaces the signed-in person may enter, independent of their seeker/employer account type. */
export async function getHiringWorkspacesForUser(userId: string) {
  const memberships = await prisma.companyMember.findMany({
    where: { userId, status: "ACTIVE" },
    include: { company: { select: { id: true, companyName: true, logoUrl: true } } },
    orderBy: { joinedAt: "desc" },
  });
  const enabled = await Promise.all(memberships.map((member) => isCollaborativeHiringEnabled(member.companyId)));
  return memberships.filter((_member, index) => enabled[index]);
}

export async function requireCompanyMembership(companyId: string, userId: string, permission?: string) {
  await requireCollaborativeHiringEnabled(companyId);
  const membership = await getActiveCompanyMembership(companyId, userId);
  if (!membership) throw new ApiError("You do not have access to this company workspace.", 403);
  if (permission && !hasCollaborativePermission(membership.role, permission)) {
    throw new ApiError("You do not have permission to perform this action.", 403);
  }
  return membership;
}

export function createInvitationToken() {
  const token = randomBytes(32).toString("base64url");
  return { token, tokenHash: hashInvitationToken(token) };
}

export function hashInvitationToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
