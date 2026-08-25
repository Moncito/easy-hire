import { ApiError } from "@/lib/api-error";
import { prisma } from "@/lib/prisma";
import { requireCompanyMembership } from "@/lib/collaborative-hiring";
import { getEmployerCompanyProfile } from "@/lib/companies";

/** Gated on team:read, not company:read — OWNER only holds company:manage in the permission matrix. */
export async function getCollaborativeCompanyProfile(companyId: string, actorUserId: string) {
  const membership = await requireCompanyMembership(companyId, actorUserId, "team:read");
  const result = await getEmployerCompanyProfile(companyId);
  if (!result) throw new ApiError("Company not found", 404);
  return { membership, ...result };
}

/** Lightweight chip data for the workspace topbar — avoids every page having to select company fields just to render a branding chip. */
export async function getCollaborativeCompanyBranding(companyId: string, actorUserId: string) {
  await requireCompanyMembership(companyId, actorUserId, "team:read");
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { companyName: true, logoUrl: true, verifiedStatus: true },
  });
  if (!company) throw new ApiError("Company not found", 404);
  return company;
}
