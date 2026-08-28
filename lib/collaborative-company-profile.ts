import { unstable_cache, revalidateTag } from "next/cache";
import { ApiError } from "@/lib/api-error";
import { prisma } from "@/lib/prisma";
import { requireCompanyMembership } from "@/lib/collaborative-hiring";
import { companyBrandingTag } from "@/lib/collaborative-hiring-cache-tags";
import { reviveDates } from "@/lib/cache-utils";
import { getEmployerCompanyProfile } from "@/lib/companies";

const COMPANY_BRANDING_REVALIDATE_SECONDS = 30;

/** Drop the cached branding/profile for a company (call after any Company row edit — logo, name, verification status, etc.). */
export function invalidateCollaborativeCompanyBranding(companyId: string) {
  revalidateTag(companyBrandingTag(companyId), "max");
}

/** Gated on team:read, not company:read — OWNER only holds company:manage in the permission matrix. */
export async function getCollaborativeCompanyProfile(companyId: string, actorUserId: string) {
  const result = await unstable_cache(
    async () => {
      const membership = await requireCompanyMembership(companyId, actorUserId, "team:read");
      const profile = await getEmployerCompanyProfile(companyId);
      if (!profile) throw new ApiError("Company not found", 404);
      return { membership, ...profile };
    },
    ["collaborative-company-profile", companyId, actorUserId],
    { revalidate: COMPANY_BRANDING_REVALIDATE_SECONDS, tags: [companyBrandingTag(companyId)] }
  )();
  return reviveDates(result);
}

/** Lightweight chip data for the workspace topbar — avoids every page having to select company fields just to render a branding chip. */
export function getCollaborativeCompanyBranding(companyId: string, actorUserId: string) {
  return unstable_cache(
    async () => {
      await requireCompanyMembership(companyId, actorUserId, "team:read");
      const company = await prisma.company.findUnique({
        where: { id: companyId },
        select: { companyName: true, logoUrl: true, verifiedStatus: true },
      });
      if (!company) throw new ApiError("Company not found", 404);
      return company;
    },
    ["collaborative-company-branding", companyId, actorUserId],
    { revalidate: COMPANY_BRANDING_REVALIDATE_SECONDS, tags: [companyBrandingTag(companyId)] }
  )();
}
