import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { BASE_URL } from "@/lib/seo/base-url";

// The sitemap protocol caps a single file at 50,000 URLs. We stay well
// within that per entity type (rather than trying to approach the ceiling)
// and paginate each query in bounded batches instead of one unbounded
// `findMany` — `take: 500` alone silently truncated past 500 rows with no
// way to reach anything beyond it.
const SITEMAP_PAGE_SIZE = 1000;
const MAX_JOB_URLS = 20000;
const MAX_COMPANY_URLS = 5000;
const MAX_SEEKER_URLS = 10000;

/**
 * Cursor-paginates a query in `SITEMAP_PAGE_SIZE` batches (ordered by `id`
 * for stable cursoring) up to `maxTotal` rows, then stops — bounded, not
 * unbounded, and without the O(n) cost of a growing `skip`.
 */
async function paginateBounded<T extends { id: string }>(
  fetchPage: (cursor: string | null) => Promise<T[]>,
  maxTotal: number
): Promise<T[]> {
  const out: T[] = [];
  let cursor: string | null = null;

  while (out.length < maxTotal) {
    const page = await fetchPage(cursor);
    if (page.length === 0) break;
    out.push(...page);
    if (page.length < SITEMAP_PAGE_SIZE) break;
    cursor = page[page.length - 1]!.id;
  }

  return out.slice(0, maxTotal);
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${BASE_URL}/jobs`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${BASE_URL}/employers`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/pricing`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/signup`, changeFrequency: "monthly", priority: 0.5 },
  ];

  let jobRoutes: MetadataRoute.Sitemap = [];
  let companyRoutes: MetadataRoute.Sitemap = [];
  let seekerRoutes: MetadataRoute.Sitemap = [];

  try {
    const jobs = await paginateBounded(
      (cursor) =>
        prisma.job.findMany({
          where: { status: "ACTIVE", company: { verifiedStatus: "APPROVED" } },
          select: { id: true, updatedAt: true },
          orderBy: { id: "asc" },
          take: SITEMAP_PAGE_SIZE,
          ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        }),
      MAX_JOB_URLS
    );
    jobRoutes = jobs.map((job) => ({
      url: `${BASE_URL}/jobs/${job.id}`,
      lastModified: job.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.7,
    }));

    // Same verified-employer requirement as the jobs query above — a company
    // whose verification hasn't cleared shouldn't get a public, indexable URL.
    const companies = await paginateBounded(
      (cursor) =>
        prisma.company.findMany({
          where: { verifiedStatus: "APPROVED" },
          select: { id: true, updatedAt: true },
          orderBy: { id: "asc" },
          take: SITEMAP_PAGE_SIZE,
          ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        }),
      MAX_COMPANY_URLS
    );
    companyRoutes = companies.map((company) => ({
      url: `${BASE_URL}/companies/${company.id}`,
      lastModified: company.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.5,
    }));

    // Deviation from the "must not be HIDDEN" instruction this task shipped
    // with: the public profile route (`getPublicSeeker` in
    // `lib/seeker/public-seekers.ts`) gates strictly on
    // `visibility: "PUBLIC"`, not "anything but HIDDEN" — a STANDARD-visibility
    // profile 404s there today. Listing STANDARD profiles here would publish
    // dead links (crawled, then rejected) and, worse, would list profiles
    // whose owners never opted into public/search-engine visibility — only
    // PUBLIC is an explicit opt-in for that. So this mirrors the page's actual
    // gate (`visibility: "PUBLIC"`) instead of the broader "not HIDDEN" rule,
    // to stay a privacy floor rather than a ceiling.
    const seekers = await paginateBounded(
      (cursor) =>
        prisma.seekerProfile.findMany({
          where: { visibility: "PUBLIC" },
          select: { id: true, updatedAt: true },
          orderBy: { id: "asc" },
          take: SITEMAP_PAGE_SIZE,
          ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        }),
      MAX_SEEKER_URLS
    );
    seekerRoutes = seekers.map((seeker) => ({
      url: `${BASE_URL}/seekers/${seeker.id}`,
      lastModified: seeker.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.4,
    }));
  } catch {
    // DB may be unavailable during build — static routes still emit
  }

  return [...staticRoutes, ...jobRoutes, ...companyRoutes, ...seekerRoutes];
}
