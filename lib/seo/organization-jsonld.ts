import type { getPublicCompany } from "@/lib/public-companies";
import { BASE_URL, toAbsoluteUrl } from "@/lib/seo/base-url";

/**
 * The exact shape `getPublicCompany` resolves to (Company + its active `jobs`,
 * with `reviveDates` applied). Derived via `Awaited<ReturnType<...>>` rather
 * than hand-copied so this can't silently drift from
 * `lib/shared/public-companies.ts`.
 *
 * Note, unlike `getPublicJob`, `getPublicCompany` does NOT filter on
 * `verifiedStatus` — it will resolve a PENDING or REJECTED company too (see
 * its `prisma.company.findUnique` call, which has no `verifiedStatus`
 * clause). So this builder makes no "already publishable" assumption the way
 * `job-posting-jsonld.ts` does for jobs; it just renders whatever company
 * record it's given. `app/sitemap.ts` applies its own
 * `verifiedStatus: "APPROVED"` filter before listing company URLs at all —
 * that's a sitemap-inclusion decision, not something this builder enforces.
 */
export type PublicCompanyForJsonLd = Awaited<ReturnType<typeof getPublicCompany>>;

/**
 * `sameAs` takes every social/profile URL the `Company` model carries
 * (`website`, `linkedinUrl`, `facebookUrl`, `instagramUrl`, `xUrl` — see
 * `prisma/schema.prisma`), dropping the ones that are null.
 */
function buildSameAs(company: PublicCompanyForJsonLd): string[] {
  return [
    company.website,
    company.linkedinUrl,
    company.facebookUrl,
    company.instagramUrl,
    company.xUrl,
  ].filter((url): url is string => Boolean(url));
}

/**
 * Builds an `Organization` JSON-LD object for a company's public profile
 * page (`app/companies/[id]/page.tsx`).
 */
export function buildOrganizationJsonLd(company: PublicCompanyForJsonLd) {
  const logo = toAbsoluteUrl(company.logoUrl);
  const sameAs = buildSameAs(company);

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: company.companyName,
    url: `${BASE_URL}/companies/${company.id}`,
    ...(logo ? { logo } : {}),
    ...(sameAs.length > 0 ? { sameAs } : {}),
    ...(company.description ? { description: company.description } : {}),
  };
}
