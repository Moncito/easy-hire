import { createHash, randomBytes } from "crypto";
import { unstable_cache, revalidateTag } from "next/cache";
import { CompanyMemberRole, CompanyMemberStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";
import { isEmployerPro } from "@/lib/billing/subscriptions";
import { companyMembershipTag, hiringWorkspacesTag } from "@/lib/collaborative-hiring-cache-tags";

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

const COMPANY_ROLE_LABELS: Record<CompanyMemberRole, string> = {
  OWNER: "Owner",
  RECRUITER: "Recruiter",
  HIRING_MANAGER: "Hiring Manager",
  VIEWER: "Viewer",
};

export function companyMemberRoleLabel(role: CompanyMemberRole) {
  return COMPANY_ROLE_LABELS[role];
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

/**
 * Short-lived in-process cache for the enablement gate. Every messaging request
 * (list, open thread, 2.5s poll, send) runs this check; each uncached call is
 * two round-trips to a DB that can sit ~150ms+ away. Enable/disable and plan
 * changes are rare, so a 60s stale window is an acceptable trade for cutting
 * that fixed cost off every request. Per-instance — no cross-process coherence
 * needed for a value this forgiving.
 */
const COLLAB_ENABLED_TTL_MS = 60_000;
const collabEnabledCache = new Map<string, { value: boolean; expires: number }>();

export async function isCollaborativeHiringEnabledCached(companyId: string): Promise<boolean> {
  const hit = collabEnabledCache.get(companyId);
  if (hit && hit.expires > Date.now()) return hit.value;
  const value = await isCollaborativeHiringEnabled(companyId);
  collabEnabledCache.set(companyId, { value, expires: Date.now() + COLLAB_ENABLED_TTL_MS });
  return value;
}

/** Drop the cached enablement flag for a company (call after enabling/disabling or a plan change). */
export function invalidateCollaborativeHiringEnabled(companyId: string) {
  collabEnabledCache.delete(companyId);
}

export async function requireCollaborativeHiringEnabled(companyId: string) {
  if (!(await isCollaborativeHiringEnabledCached(companyId))) {
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

const MEMBERSHIP_REVALIDATE_SECONDS = 30;
const WORKSPACES_REVALIDATE_SECONDS = 30;

function findActiveCompanyMemberRow(companyId: string, userId: string) {
  return prisma.companyMember.findFirst({ where: { companyId, userId, status: "ACTIVE" } });
}

/**
 * Hit on every navigation into `/hiring/[companyId]/**` (via requireCompanyMembership
 * in the layout) and by app/seeker/layout.tsx. Cached so switching between pages in a
 * workspace, or revisiting one, doesn't re-query membership on every request.
 */
function getActiveCompanyMembershipCached(companyId: string, userId: string) {
  return unstable_cache(
    () => findActiveCompanyMemberRow(companyId, userId),
    ["company-membership", companyId, userId],
    { revalidate: MEMBERSHIP_REVALIDATE_SECONDS, tags: [companyMembershipTag(companyId, userId)] }
  )();
}

export async function getActiveCompanyMembership(companyId: string, userId: string) {
  // Common case is a single cached query — the backfill upsert below only runs
  // on the rare miss (a pre-existing owner whose membership row hasn't been
  // created yet), instead of unconditionally on every request in this workspace.
  const existing = await getActiveCompanyMembershipCached(companyId, userId);
  if (existing) return existing;
  await ensureCompanyOwnerMembership(companyId);
  invalidateCompanyMembership(companyId, userId);
  return findActiveCompanyMemberRow(companyId, userId);
}

/** Drop the cached membership row for one user in one company (call after a role change, removal, or invite acceptance). */
export function invalidateCompanyMembership(companyId: string, userId: string) {
  revalidateTag(companyMembershipTag(companyId, userId), "max");
}

/** Drop the cached workspace list for one user (call after their membership set changes: joined, removed, role change). */
export function invalidateHiringWorkspaces(userId: string) {
  revalidateTag(hiringWorkspacesTag(userId), "max");
}

/** All company workspaces the signed-in person may enter, independent of their seeker/employer account type. */
export function getHiringWorkspacesForUser(userId: string) {
  return unstable_cache(
    async () => {
      const memberships = await prisma.companyMember.findMany({
        where: { userId, status: "ACTIVE" },
        include: { company: { select: { id: true, companyName: true, logoUrl: true } } },
        orderBy: { joinedAt: "desc" },
      });
      const enabled = await Promise.all(memberships.map((member) => isCollaborativeHiringEnabledCached(member.companyId)));
      return memberships.filter((_member, index) => enabled[index]);
    },
    ["hiring-workspaces", userId],
    { revalidate: WORKSPACES_REVALIDATE_SECONDS, tags: [hiringWorkspacesTag(userId)] }
  )();
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
