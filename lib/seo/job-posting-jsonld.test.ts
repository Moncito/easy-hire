import { describe, expect, it } from "vitest";
import { buildJobPostingJsonLd, type PublicJobForJsonLd } from "@/lib/seo/job-posting-jsonld";

/**
 * Matches the exact shape `getPublicJob` resolves to: the full `Job` row
 * (see `prisma/schema.prisma`) plus the `company` select and
 * `screeningQuestions` include from `getPublicJobUncached`
 * (`lib/jobs/public-listing.ts`), with real `Date`s (post `reviveDates`).
 */
function makeJob(overrides: Partial<PublicJobForJsonLd> = {}): PublicJobForJsonLd {
  const base: PublicJobForJsonLd = {
    id: "job_1",
    companyId: "company_1",
    title: "Executive Virtual Assistant",
    description: "Support a busy founder with inbox and calendar management.",
    requirements: null,
    benefits: null,
    category: "Admin Support",
    industry: "SaaS",
    employmentType: "FULL_TIME",
    salaryMin: null,
    salaryMax: null,
    salaryPeriod: "MONTHLY",
    location: "Manila, Philippines",
    remoteType: "REMOTE",
    status: "ACTIVE",
    targetHireCount: 1,
    publishedAt: new Date("2026-08-01T00:00:00.000Z"),
    reviewRejectionReason: null,
    featuredUntil: null,
    createdAt: new Date("2026-07-30T00:00:00.000Z"),
    updatedAt: new Date("2026-08-01T00:00:00.000Z"),
    expiresAt: null,
    company: {
      id: "company_1",
      companyName: "Acme Outsourcing",
      logoUrl: null,
      bannerUrl: null,
      description: "We help startups scale.",
      website: null,
      industry: "SaaS",
      verifiedStatus: "APPROVED",
      headquarters: null,
      highlights: [],
    },
    screeningQuestions: [],
  } as unknown as PublicJobForJsonLd;

  return { ...base, ...overrides } as PublicJobForJsonLd;
}

describe("buildJobPostingJsonLd", () => {
  it("maps the CONTRACT employment type to Google's CONTRACTOR vocabulary", () => {
    const jsonLd = buildJobPostingJsonLd(makeJob({ employmentType: "CONTRACT" } as Partial<PublicJobForJsonLd>));
    expect(jsonLd.employmentType).toBe("CONTRACTOR");
  });

  it("passes FULL_TIME and PART_TIME through unchanged", () => {
    expect(buildJobPostingJsonLd(makeJob({ employmentType: "FULL_TIME" } as Partial<PublicJobForJsonLd>)).employmentType).toBe(
      "FULL_TIME"
    );
    expect(buildJobPostingJsonLd(makeJob({ employmentType: "PART_TIME" } as Partial<PublicJobForJsonLd>)).employmentType).toBe(
      "PART_TIME"
    );
  });

  describe("baseSalary", () => {
    it("maps HOURLY to unitText HOUR", () => {
      const jsonLd = buildJobPostingJsonLd(
        makeJob({ salaryMin: 100, salaryMax: 200, salaryPeriod: "HOURLY" } as Partial<PublicJobForJsonLd>)
      );
      expect(jsonLd.baseSalary?.value.unitText).toBe("HOUR");
    });

    it("maps MONTHLY to unitText MONTH", () => {
      const jsonLd = buildJobPostingJsonLd(
        makeJob({ salaryMin: 25000, salaryMax: 40000, salaryPeriod: "MONTHLY" } as Partial<PublicJobForJsonLd>)
      );
      expect(jsonLd.baseSalary?.value.unitText).toBe("MONTH");
    });

    it("maps ANNUAL to unitText YEAR", () => {
      const jsonLd = buildJobPostingJsonLd(
        makeJob({ salaryMin: 300000, salaryMax: 480000, salaryPeriod: "ANNUAL" } as Partial<PublicJobForJsonLd>)
      );
      expect(jsonLd.baseSalary?.value.unitText).toBe("YEAR");
    });

    it("uses PHP as the currency", () => {
      const jsonLd = buildJobPostingJsonLd(
        makeJob({ salaryMin: 25000, salaryMax: 40000 } as Partial<PublicJobForJsonLd>)
      );
      expect(jsonLd.baseSalary?.currency).toBe("PHP");
    });

    it("is omitted entirely when both salaryMin and salaryMax are null", () => {
      const jsonLd = buildJobPostingJsonLd(
        makeJob({ salaryMin: null, salaryMax: null } as Partial<PublicJobForJsonLd>)
      );
      expect(jsonLd.baseSalary).toBeUndefined();
      expect("baseSalary" in jsonLd).toBe(false);
    });

    it("emits only minValue when salaryMax is null", () => {
      const jsonLd = buildJobPostingJsonLd(
        makeJob({ salaryMin: 25000, salaryMax: null } as Partial<PublicJobForJsonLd>)
      );
      expect(jsonLd.baseSalary?.value.minValue).toBe(25000);
      expect("maxValue" in (jsonLd.baseSalary?.value ?? {})).toBe(false);
    });
  });

  describe("validThrough", () => {
    it("is omitted entirely (not emitted as null) when expiresAt is null", () => {
      const jsonLd = buildJobPostingJsonLd(makeJob({ expiresAt: null } as Partial<PublicJobForJsonLd>));
      expect("validThrough" in jsonLd).toBe(false);
    });

    it("is emitted as an ISO 8601 string when expiresAt is set", () => {
      const expiresAt = new Date("2026-12-31T00:00:00.000Z");
      const jsonLd = buildJobPostingJsonLd(makeJob({ expiresAt } as Partial<PublicJobForJsonLd>));
      expect(jsonLd.validThrough).toBe(expiresAt.toISOString());
    });
  });

  describe("datePosted", () => {
    it("uses publishedAt when present", () => {
      const publishedAt = new Date("2026-08-05T00:00:00.000Z");
      const jsonLd = buildJobPostingJsonLd(makeJob({ publishedAt } as Partial<PublicJobForJsonLd>));
      expect(jsonLd.datePosted).toBe(publishedAt.toISOString());
    });

    it("falls back to createdAt when publishedAt is null", () => {
      const createdAt = new Date("2026-07-01T00:00:00.000Z");
      const jsonLd = buildJobPostingJsonLd(makeJob({ publishedAt: null, createdAt } as Partial<PublicJobForJsonLd>));
      expect(jsonLd.datePosted).toBe(createdAt.toISOString());
    });
  });

  describe("remoteType location branches", () => {
    it("REMOTE: sets jobLocationType TELECOMMUTE with a PH applicantLocationRequirements, no jobLocation", () => {
      const jsonLd = buildJobPostingJsonLd(makeJob({ remoteType: "REMOTE" } as Partial<PublicJobForJsonLd>));
      expect(jsonLd.jobLocationType).toBe("TELECOMMUTE");
      expect(jsonLd.applicantLocationRequirements).toEqual({ "@type": "Country", name: "Philippines" });
      expect("jobLocation" in jsonLd).toBe(false);
    });

    it("ONSITE: sets a jobLocation Place built from the free-text location, no jobLocationType", () => {
      const jsonLd = buildJobPostingJsonLd(
        makeJob({ remoteType: "ONSITE", location: "BGC, Taguig" } as Partial<PublicJobForJsonLd>)
      );
      expect(jsonLd.jobLocation).toEqual({
        "@type": "Place",
        address: { "@type": "PostalAddress", addressLocality: "BGC, Taguig", addressCountry: "PH" },
      });
      expect("jobLocationType" in jsonLd).toBe(false);
      expect("applicantLocationRequirements" in jsonLd).toBe(false);
    });

    it("HYBRID: sets jobLocation the same way as ONSITE, and does not also set TELECOMMUTE", () => {
      const jsonLd = buildJobPostingJsonLd(
        makeJob({ remoteType: "HYBRID", location: "Cebu City" } as Partial<PublicJobForJsonLd>)
      );
      expect(jsonLd.jobLocation).toEqual({
        "@type": "Place",
        address: { "@type": "PostalAddress", addressLocality: "Cebu City", addressCountry: "PH" },
      });
      expect("jobLocationType" in jsonLd).toBe(false);
    });
  });

  describe("description", () => {
    it("is not truncated even when longer than 160 characters", () => {
      const longDescription = "A".repeat(500);
      const jsonLd = buildJobPostingJsonLd(makeJob({ description: longDescription } as Partial<PublicJobForJsonLd>));
      expect(jsonLd.description).toContain(longDescription);
    });

    it("combines description, requirements, and benefits when present", () => {
      const jsonLd = buildJobPostingJsonLd(
        makeJob({
          description: "Manage inboxes.",
          requirements: "2+ years experience.",
          benefits: "HMO on day one.",
        } as Partial<PublicJobForJsonLd>)
      );
      expect(jsonLd.description).toContain("Manage inboxes.");
      expect(jsonLd.description).toContain("2+ years experience.");
      expect(jsonLd.description).toContain("HMO on day one.");
    });
  });

  describe("hiringOrganization", () => {
    it("omits sameAs and logo when website and logoUrl are null", () => {
      const jsonLd = buildJobPostingJsonLd(makeJob());
      expect("sameAs" in jsonLd.hiringOrganization).toBe(false);
      expect("logo" in jsonLd.hiringOrganization).toBe(false);
    });

    it("normalizes a bare storage path into an absolute logo URL", () => {
      const jsonLd = buildJobPostingJsonLd(
        makeJob({
          company: {
            id: "company_1",
            companyName: "Acme Outsourcing",
            logoUrl: "logos/company_1/logo.png",
            bannerUrl: null,
            description: null,
            website: "https://acme.example",
            industry: null,
            verifiedStatus: "APPROVED",
            headquarters: null,
            highlights: [],
          },
        } as Partial<PublicJobForJsonLd>)
      );
      expect(jsonLd.hiringOrganization.logo).toMatch(/^https?:\/\//);
      expect(jsonLd.hiringOrganization.sameAs).toBe("https://acme.example");
    });
  });

  it("identifies the job by id, scoped to EasyHire", () => {
    const jsonLd = buildJobPostingJsonLd(makeJob({ id: "job_42" } as Partial<PublicJobForJsonLd>));
    expect(jsonLd.identifier).toEqual({ "@type": "PropertyValue", name: "EasyHire", value: "job_42" });
  });
});
