import { describe, expect, it } from "vitest";
import { buildOrganizationJsonLd, type PublicCompanyForJsonLd } from "@/lib/seo/organization-jsonld";

/**
 * Matches the shape `getPublicCompany` resolves to: the full `Company` row
 * (see `prisma/schema.prisma`) plus its `jobs` include
 * (`lib/shared/public-companies.ts`), with real `Date`s (post `reviveDates`).
 */
function makeCompany(overrides: Partial<PublicCompanyForJsonLd> = {}): PublicCompanyForJsonLd {
  const base: PublicCompanyForJsonLd = {
    id: "company_1",
    userId: "user_1",
    companyName: "Acme Outsourcing",
    logoUrl: null,
    bannerUrl: null,
    description: null,
    website: null,
    industry: "SaaS",
    verifiedStatus: "APPROVED",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    teamSize: null,
    foundedYear: null,
    headquarters: null,
    highlights: [],
    linkedinUrl: null,
    facebookUrl: null,
    instagramUrl: null,
    xUrl: null,
    verificationRejectionReason: null,
    jobs: [],
  } as unknown as PublicCompanyForJsonLd;

  return { ...base, ...overrides } as PublicCompanyForJsonLd;
}

describe("buildOrganizationJsonLd", () => {
  it("builds the canonical /companies/{id} URL", () => {
    const jsonLd = buildOrganizationJsonLd(makeCompany({ id: "company_42" } as Partial<PublicCompanyForJsonLd>));
    expect(jsonLd.url).toMatch(/\/companies\/company_42$/);
  });

  it("omits logo, sameAs, and description when the company has none of them", () => {
    const jsonLd = buildOrganizationJsonLd(makeCompany());
    expect("logo" in jsonLd).toBe(false);
    expect("sameAs" in jsonLd).toBe(false);
    expect("description" in jsonLd).toBe(false);
  });

  it("collects every non-null social URL into sameAs", () => {
    const jsonLd = buildOrganizationJsonLd(
      makeCompany({
        website: "https://acme.example",
        linkedinUrl: "https://linkedin.com/company/acme",
        facebookUrl: null,
        instagramUrl: "https://instagram.com/acme",
        xUrl: null,
      } as Partial<PublicCompanyForJsonLd>)
    );
    expect(jsonLd.sameAs).toEqual([
      "https://acme.example",
      "https://linkedin.com/company/acme",
      "https://instagram.com/acme",
    ]);
  });

  it("normalizes a bare storage path into an absolute logo URL", () => {
    const jsonLd = buildOrganizationJsonLd(
      makeCompany({ logoUrl: "logos/company_1/logo.png" } as Partial<PublicCompanyForJsonLd>)
    );
    expect(jsonLd.logo).toMatch(/^https?:\/\//);
  });

  it("passes an already-absolute logo URL through unchanged", () => {
    const jsonLd = buildOrganizationJsonLd(
      makeCompany({ logoUrl: "https://cdn.example.com/logo.png" } as Partial<PublicCompanyForJsonLd>)
    );
    expect(jsonLd.logo).toBe("https://cdn.example.com/logo.png");
  });

  it("includes description when present", () => {
    const jsonLd = buildOrganizationJsonLd(
      makeCompany({ description: "We help startups scale." } as Partial<PublicCompanyForJsonLd>)
    );
    expect(jsonLd.description).toBe("We help startups scale.");
  });
});
