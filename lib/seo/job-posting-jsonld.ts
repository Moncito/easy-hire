import type { getPublicJob } from "@/lib/jobs/public-listing";
import { toAbsoluteUrl } from "@/lib/seo/base-url";

/**
 * The exact shape `getPublicJob` resolves to (job + `company` select +
 * `screeningQuestions`, with `reviveDates` turning cache-serialized ISO
 * strings back into real `Date`s). Derived via `Awaited<ReturnType<...>>`
 * instead of hand-copied so this file can't silently drift from
 * `lib/jobs/public-listing.ts` — which we must not edit (another agent owns
 * it in this branch).
 */
export type PublicJobForJsonLd = Awaited<ReturnType<typeof getPublicJob>>;

/**
 * Google's `employmentType` vocabulary is close to, but not identical to,
 * our Prisma `EmploymentType` enum: Google has no "CONTRACT" value, only
 * "CONTRACTOR". FULL_TIME/PART_TIME pass through unchanged.
 * https://developers.google.com/search/docs/appearance/structured-data/job-posting
 */
const EMPLOYMENT_TYPE_MAP: Record<string, string> = {
  FULL_TIME: "FULL_TIME",
  PART_TIME: "PART_TIME",
  CONTRACT: "CONTRACTOR",
};

/** Google's `QuantitativeValue.unitText` vocabulary for a pay rate's time unit. */
const SALARY_PERIOD_UNIT: Record<string, string> = {
  HOURLY: "HOUR",
  MONTHLY: "MONTH",
  ANNUAL: "YEAR",
};

/** EasyHire is a PH-only marketplace — every applicant this listing should reach is PH-based. */
const APPLICANT_LOCATION_REQUIREMENTS = { "@type": "Country", name: "Philippines" } as const;

/**
 * `description`, `requirements`, and `benefits` are Markdown source (see
 * `MarkdownContent` usage in `components/jobs/JobDetailTabs.tsx`), not
 * pre-rendered HTML. Google's JobPosting spec accepts plain text for
 * `description` — HTML is *permitted*, not required — so we join the
 * Markdown sections with plain-text labels rather than inventing an HTML
 * rendering pipeline here. Never truncated: that's a meta-description
 * concern (see `generateMetadata` in `app/jobs/[id]/page.tsx`), not this one.
 */
function buildDescription(job: PublicJobForJsonLd): string {
  const sections = [job.description];
  if (job.requirements) sections.push(`Requirements:\n${job.requirements}`);
  if (job.benefits) sections.push(`Benefits:\n${job.benefits}`);
  return sections.join("\n\n");
}

/**
 * Omit the whole `baseSalary` block when neither bound is set — a salary
 * block with no numbers is worse than none (it can read as "$0"). When only
 * one bound is present, emit only that field; never fabricate the other.
 */
function buildBaseSalary(job: PublicJobForJsonLd) {
  if (job.salaryMin == null && job.salaryMax == null) return undefined;

  const unitText = SALARY_PERIOD_UNIT[job.salaryPeriod] ?? "MONTH";

  return {
    "@type": "MonetaryAmount",
    // There is no currency column on Job (prisma/schema.prisma) — PHP is a
    // fixed, safe assumption rather than a guess, because the whole app
    // renders every price with ₱ (see `formatPhp` in
    // `components/employers/EmployerSalaryGuide.tsx`) and this is a
    // Philippines-only VA marketplace.
    currency: "PHP",
    value: {
      "@type": "QuantitativeValue",
      unitText,
      ...(job.salaryMin != null ? { minValue: job.salaryMin } : {}),
      ...(job.salaryMax != null ? { maxValue: job.salaryMax } : {}),
    },
  };
}

/**
 * `remoteType` drives `jobLocationType` / `jobLocation` — the most common
 * cause of Google rejecting a JobPosting.
 *
 * - REMOTE: `jobLocationType: "TELECOMMUTE"` plus
 *   `applicantLocationRequirements`, which Google requires alongside it and
 *   rejects the posting without. `location` on `Job` is a single unstructured
 *   free-text field (no street/city/region columns) that can't be reliably
 *   parsed into a country, so rather than guess we hardcode Philippines —
 *   this is a PH VA marketplace by product design, not an inference from the
 *   string. No `jobLocation` is emitted: TELECOMMUTE means "can be done from
 *   anywhere," so a physical place would contradict it.
 * - ONSITE / HYBRID: both have a real physical component, so both get a
 *   `jobLocation` built from the same free-text `location` string (put
 *   verbatim into `addressLocality` since it can't be split further, with
 *   `addressCountry` hardcoded PH for the same reason as above). HYBRID is
 *   deliberately NOT also marked `jobLocationType: "TELECOMMUTE"`: per
 *   Google's guidance that value means the role can be performed from
 *   anywhere, which misrepresents a hybrid role that still requires in-office
 *   days at a specific place. So HYBRID and ONSITE emit the identical shape.
 */
function buildLocationFields(job: PublicJobForJsonLd) {
  if (job.remoteType === "REMOTE") {
    return {
      jobLocationType: "TELECOMMUTE",
      applicantLocationRequirements: APPLICANT_LOCATION_REQUIREMENTS,
    };
  }

  return {
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: job.location,
        addressCountry: "PH",
      },
    },
  };
}

/**
 * `logoUrl` may be a bare storage object path or an already-absolute URL —
 * `toAbsoluteUrl` normalizes it. `website` is used as-is for `sameAs`
 * (already `z.string().url()`-validated on write, see
 * `lib/validations/company.ts`).
 */
function buildHiringOrganization(company: PublicJobForJsonLd["company"]) {
  const logo = toAbsoluteUrl(company.logoUrl);

  return {
    "@type": "Organization",
    name: company.companyName,
    ...(company.website ? { sameAs: company.website } : {}),
    ...(logo ? { logo } : {}),
  };
}

/**
 * Builds a `JobPosting` JSON-LD object from `getPublicJob`'s result.
 *
 * Safety property: `getPublicJob` already filters to `status: "ACTIVE"`,
 * unexpired (`expiresAt` null or in the future), and
 * `company.verifiedStatus: "APPROVED"` — see its `where` clause in
 * `lib/jobs/public-listing.ts` — and throws a 404 otherwise. Anything that
 * reaches this builder is therefore publishable by construction; this file
 * intentionally does not re-check any of that, to avoid a second copy of the
 * filter drifting out of sync with the original.
 */
export function buildJobPostingJsonLd(job: PublicJobForJsonLd) {
  const datePosted = job.publishedAt ?? job.createdAt;
  const baseSalary = buildBaseSalary(job);

  return {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: buildDescription(job),
    identifier: {
      "@type": "PropertyValue",
      name: "EasyHire",
      value: job.id,
    },
    datePosted: datePosted.toISOString(),
    ...(job.expiresAt ? { validThrough: job.expiresAt.toISOString() } : {}),
    employmentType: EMPLOYMENT_TYPE_MAP[job.employmentType] ?? job.employmentType,
    hiringOrganization: buildHiringOrganization(job.company),
    ...(baseSalary ? { baseSalary } : {}),
    ...buildLocationFields(job),
  };
}
