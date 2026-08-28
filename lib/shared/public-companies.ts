import { unstable_cache, revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";
import { publicCompanyTag } from "@/lib/public-cache-tags";
import { reviveDates } from "@/lib/cache-utils";

const PUBLIC_COMPANY_REVALIDATE_SECONDS = 30;

/** Drop the cached public profile for one company (call after any Company row edit or job status change). */
export function invalidatePublicCompany(companyId: string) {
  revalidateTag(publicCompanyTag(companyId), "max");
}

export async function getPublicCompany(companyId: string) {
  const company = await unstable_cache(
    async () => {
      const now = new Date();

      const result = await prisma.company.findUnique({
        where: { id: companyId },
        include: {
          jobs: {
            where: {
              status: "ACTIVE",
              OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
            },
            orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
            select: {
              id: true,
              title: true,
              category: true,
              employmentType: true,
              remoteType: true,
              location: true,
              salaryMin: true,
              salaryMax: true,
              publishedAt: true,
            },
          },
        },
      });

      if (!result) {
        throw new ApiError("Company not found", 404);
      }

      return result;
    },
    ["public-company", companyId],
    { revalidate: PUBLIC_COMPANY_REVALIDATE_SECONDS, tags: [publicCompanyTag(companyId)] }
  )();
  return reviveDates(company);
}
