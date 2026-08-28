import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import type { JobSearchInput } from "@/lib/validations/job-search";
import { ApiError } from "@/lib/api-error";
import { fromMonthlyEquivalent, toMonthlyEquivalent, type SalaryPeriod } from "@/lib/format";
import { isJobCurrentlyFeatured } from "@/lib/jobs/featured";
import { publicJobTag, publicJobsListTag } from "@/lib/public-cache-tags";
import { reviveDates } from "@/lib/cache-utils";

const PUBLIC_JOBS_LIST_REVALIDATE_SECONDS = 30;
const PUBLIC_JOB_CATEGORIES_REVALIDATE_SECONDS = 300;
const PUBLIC_JOB_DETAIL_REVALIDATE_SECONDS = 30;

export type PublicJobListItem = {
  id: string;
  title: string;
  category: string;
  industry: string | null;
  employmentType: string;
  remoteType: string;
  location: string;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryPeriod: string;
  publishedAt: string | null;
  createdAt: string;
  expiresAt: string | null;
  featured: boolean;
  company: {
    id: string;
    companyName: string;
    logoUrl: string | null;
    verifiedStatus: string;
    industry: string | null;
  };
};

type SearchResult = {
  jobs: PublicJobListItem[];
  nextCursor: string | null;
};

const POSTED_WITHIN_MS: Record<string, number> = {
  "24h": 24 * 60 * 60 * 1000,
  "3d": 3 * 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000,
};

function baseActiveJobWhere(): Prisma.JobWhereInput[] {
  const now = new Date();
  return [
    { status: "ACTIVE" },
    { OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
    { company: { verifiedStatus: "APPROVED" } },
  ];
}

/**
 * Salary filters are entered by the seeker in a single period (via the
 * pay-period toggle) but jobs are posted in whatever period the employer
 * chose. We compare on a monthly-equivalent basis so a "50,000-100,000/mo"
 * filter still surfaces a job posted hourly or annually — without ever
 * converting/displaying a job's own stated numbers.
 */
function activeJobWhere(input: JobSearchInput): Prisma.JobWhereInput {
  const now = new Date();
  const andClauses: Prisma.JobWhereInput[] = baseActiveJobWhere();

  if (input.category) andClauses.push({ category: input.category });
  if (input.industry) andClauses.push({ industry: input.industry });
  if (input.employmentType) andClauses.push({ employmentType: input.employmentType });
  if (input.remoteType) andClauses.push({ remoteType: input.remoteType });
  if (input.location) andClauses.push({ location: { contains: input.location, mode: "insensitive" } });

  if (input.postedWithin) {
    const windowMs = POSTED_WITHIN_MS[input.postedWithin];
    if (windowMs) {
      const cutoff = new Date(now.getTime() - windowMs);
      andClauses.push({
        OR: [{ publishedAt: { gte: cutoff } }, { publishedAt: null, createdAt: { gte: cutoff } }],
      });
    }
  }

  const salaryWhere = buildSalaryOverlapWhere(input);
  if (salaryWhere) andClauses.push(salaryWhere);

  if (input.q) {
    andClauses.push({
      OR: [
        { title: { contains: input.q, mode: "insensitive" } },
        { description: { contains: input.q, mode: "insensitive" } },
        { category: { contains: input.q, mode: "insensitive" } },
        { industry: { contains: input.q, mode: "insensitive" } },
        { requirements: { contains: input.q, mode: "insensitive" } },
        { company: { companyName: { contains: input.q, mode: "insensitive" } } },
      ],
    });
  }

  return { AND: andClauses };
}

function buildSalaryOverlapWhere(input: JobSearchInput): Prisma.JobWhereInput | null {
  if (input.salaryMin == null && input.salaryMax == null) return null;

  const filterPeriod = (input.salaryPeriod ?? "MONTHLY") as SalaryPeriod;
  const monthlyMin = input.salaryMin != null ? toMonthlyEquivalent(input.salaryMin, filterPeriod) : null;
  const monthlyMax = input.salaryMax != null ? toMonthlyEquivalent(input.salaryMax, filterPeriod) : null;

  const periods: SalaryPeriod[] = ["HOURLY", "MONTHLY", "ANNUAL"];
  const branches: Prisma.JobWhereInput[] = periods.map((period) => {
    const clauses: Prisma.JobWhereInput[] = [{ salaryPeriod: period }];
    if (monthlyMin != null) {
      const threshold = fromMonthlyEquivalent(monthlyMin, period);
      clauses.push({
        OR: [{ salaryMax: { gte: threshold } }, { salaryMax: null, salaryMin: { gte: threshold } }],
      });
    }
    if (monthlyMax != null) {
      const threshold = fromMonthlyEquivalent(monthlyMax, period);
      clauses.push({
        OR: [{ salaryMin: { lte: threshold } }, { salaryMin: null }],
      });
    }
    return { AND: clauses };
  });

  return { OR: branches };
}

/** Featured (Employer Pro) jobs always sort to the top of their tier before any secondary sort. */
const FEATURED_FIRST: Prisma.JobOrderByWithRelationInput = {
  featuredUntil: { sort: "desc", nulls: "last" },
};

function buildOrderBy(sort: JobSearchInput["sort"]): Prisma.JobOrderByWithRelationInput[] {
  if (sort === "salary_high") {
    return [
      FEATURED_FIRST,
      { salaryMax: { sort: "desc", nulls: "last" } },
      { salaryMin: { sort: "desc", nulls: "last" } },
      { createdAt: "desc" },
      { id: "desc" },
    ];
  }
  return [FEATURED_FIRST, { createdAt: "desc" }, { id: "desc" }];
}

function mapJob(job: {
  id: string;
  title: string;
  category: string;
  industry: string | null;
  employmentType: string;
  remoteType: string;
  location: string;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryPeriod: string;
  publishedAt: Date | null;
  createdAt: Date;
  expiresAt?: Date | null;
  featuredUntil?: Date | null;
  company: {
    id: string;
    companyName: string;
    logoUrl: string | null;
    verifiedStatus: string;
    industry: string | null;
  };
}): PublicJobListItem {
  return {
    id: job.id,
    title: job.title,
    category: job.category,
    industry: job.industry,
    employmentType: job.employmentType,
    remoteType: job.remoteType,
    location: job.location,
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax,
    salaryPeriod: job.salaryPeriod,
    publishedAt: job.publishedAt?.toISOString() ?? null,
    createdAt: job.createdAt.toISOString(),
    expiresAt: job.expiresAt?.toISOString() ?? null,
    featured: isJobCurrentlyFeatured(job.featuredUntil ?? null),
    company: job.company,
  };
}

async function searchPublicJobsUncached(input: JobSearchInput): Promise<SearchResult> {
  if (input.q && input.sort !== "salary_high") {
    try {
      return await searchPublicJobsFts(input);
    } catch {
      // Fall back if search_vector migration is not applied yet.
    }
  }

  return searchPublicJobsPrisma(input);
}

export function searchPublicJobs(input: JobSearchInput): Promise<SearchResult> {
  const queryKey = JSON.stringify(
    Object.keys(input)
      .sort()
      .reduce(
        (acc, key) => {
          acc[key] = (input as Record<string, unknown>)[key];
          return acc;
        },
        {} as Record<string, unknown>
      )
  );

  return unstable_cache(
    () => searchPublicJobsUncached(input),
    ["public-jobs-search", queryKey],
    { revalidate: PUBLIC_JOBS_LIST_REVALIDATE_SECONDS, tags: [publicJobsListTag()] }
  )();
}

async function searchPublicJobsPrisma(input: JobSearchInput): Promise<SearchResult> {
  const limit = input.limit;
  const orderBy = buildOrderBy(input.sort);

  const jobs = await prisma.job.findMany({
    where: activeJobWhere(input),
    orderBy,
    take: limit + 1,
    ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
    include: {
      company: {
        select: {
          id: true,
          companyName: true,
          logoUrl: true,
          verifiedStatus: true,
          industry: true,
        },
      },
    },
  });

  const hasMore = jobs.length > limit;
  const page = hasMore ? jobs.slice(0, limit) : jobs;

  return {
    jobs: page.map(mapJob),
    nextCursor: hasMore ? page[page.length - 1]?.id ?? null : null,
  };
}

async function searchPublicJobsFts(input: JobSearchInput): Promise<SearchResult> {
  const limit = input.limit;
  const q = input.q!.trim();

  const cursorJob = input.cursor
    ? await prisma.job.findFirst({
        where: { id: input.cursor },
        select: { createdAt: true, id: true, featuredUntil: true },
      })
    : null;
  const cursorRank = cursorJob ? (isJobCurrentlyFeatured(cursorJob.featuredUntil) ? 0 : 1) : null;

  type RawRow = {
    id: string;
    title: string;
    category: string;
    industry: string | null;
    employment_type: string;
    remote_type: string;
    location: string;
    salary_min: number | null;
    salary_max: number | null;
    salary_period: string;
    published_at: Date | null;
    created_at: Date;
    expires_at: Date | null;
    featured_until: Date | null;
    company_id: string;
    company_name: string;
    logo_url: string | null;
    verified_status: string;
    company_industry: string | null;
  };

  const now = new Date();
  const postedCutoff = input.postedWithin ? new Date(now.getTime() - POSTED_WITHIN_MS[input.postedWithin]) : null;

  const rows = await prisma.$queryRaw<RawRow[]>`
    SELECT
      j.id,
      j.title,
      j.category,
      j.industry,
      j.employment_type,
      j.remote_type,
      j.location,
      j.salary_min,
      j.salary_max,
      j.salary_period,
      j.published_at,
      j.created_at,
      j.expires_at,
      j.featured_until,
      c.id AS company_id,
      c.company_name,
      c.logo_url,
      c.verified_status,
      c.industry AS company_industry
    FROM jobs j
    INNER JOIN companies c ON c.id = j.company_id
    WHERE j.status = 'ACTIVE'
      AND (j.expires_at IS NULL OR j.expires_at > NOW())
      AND c.verified_status = 'APPROVED'
      AND (
        j.search_vector @@ plainto_tsquery('english', ${q})
        OR c.company_name ILIKE '%' || ${q} || '%'
      )
      ${input.category ? Prisma.sql`AND j.category = ${input.category}` : Prisma.empty}
      ${input.industry ? Prisma.sql`AND j.industry = ${input.industry}` : Prisma.empty}
      ${input.employmentType ? Prisma.sql`AND j.employment_type = ${input.employmentType}::"EmploymentType"` : Prisma.empty}
      ${input.remoteType ? Prisma.sql`AND j.remote_type = ${input.remoteType}::"RemoteType"` : Prisma.empty}
      ${input.location ? Prisma.sql`AND j.location ILIKE '%' || ${input.location} || '%'` : Prisma.empty}
      ${postedCutoff ? Prisma.sql`AND COALESCE(j.published_at, j.created_at) >= ${postedCutoff}` : Prisma.empty}
      ${
        cursorJob
          ? Prisma.sql`AND (
              (CASE WHEN j.featured_until > NOW() THEN 0 ELSE 1 END) > ${cursorRank}
              OR (
                (CASE WHEN j.featured_until > NOW() THEN 0 ELSE 1 END) = ${cursorRank}
                AND (j.created_at, j.id) < (${cursorJob.createdAt}, ${cursorJob.id})
              )
            )`
          : Prisma.empty
      }
    ORDER BY (CASE WHEN j.featured_until > NOW() THEN 0 ELSE 1 END) ASC, j.created_at DESC, j.id DESC
    LIMIT ${limit + 1}
  `;

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;

  return {
    jobs: page.map((row) =>
      mapJob({
        id: row.id,
        title: row.title,
        category: row.category,
        industry: row.industry,
        employmentType: row.employment_type,
        remoteType: row.remote_type,
        location: row.location,
        salaryMin: row.salary_min,
        salaryMax: row.salary_max,
        salaryPeriod: row.salary_period,
        publishedAt: row.published_at,
        createdAt: row.created_at,
        expiresAt: row.expires_at,
        featuredUntil: row.featured_until,
        company: {
          id: row.company_id,
          companyName: row.company_name,
          logoUrl: row.logo_url,
          verifiedStatus: row.verified_status,
          industry: row.company_industry,
        },
      })
    ),
    nextCursor: hasMore ? page[page.length - 1]?.id ?? null : null,
  };
}

async function getPublicJobUncached(jobId: string) {
  const now = new Date();

  const job = await prisma.job.findFirst({
    where: {
      id: jobId,
      status: "ACTIVE",
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      company: { verifiedStatus: "APPROVED" },
    },
    include: {
      company: {
        select: {
          id: true,
          companyName: true,
          logoUrl: true,
          bannerUrl: true,
          description: true,
          website: true,
          industry: true,
          verifiedStatus: true,
          headquarters: true,
          highlights: true,
        },
      },
      screeningQuestions: {
        select: { id: true, prompt: true, required: true, sortOrder: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!job) {
    throw new ApiError("Job not found", 404);
  }

  return job;
}

export async function getPublicJob(jobId: string) {
  const job = await unstable_cache(
    () => getPublicJobUncached(jobId),
    ["public-job-detail", jobId],
    { revalidate: PUBLIC_JOB_DETAIL_REVALIDATE_SECONDS, tags: [publicJobTag(jobId), publicJobsListTag()] }
  )();
  return reviveDates(job);
}

export function listLandingJobs(limit = 12): Promise<PublicJobListItem[]> {
  return unstable_cache(
    async () => {
      try {
        const jobs = await prisma.job.findMany({
          where: { AND: baseActiveJobWhere() },
          orderBy: [
            FEATURED_FIRST,
            { publishedAt: { sort: "desc", nulls: "last" } },
            { createdAt: "desc" },
            { id: "desc" },
          ],
          take: limit,
          include: {
            company: {
              select: {
                id: true,
                companyName: true,
                logoUrl: true,
                verifiedStatus: true,
                industry: true,
              },
            },
          },
        });
        return jobs.map(mapJob);
      } catch {
        return [];
      }
    },
    ["public-landing-jobs", String(limit)],
    { revalidate: PUBLIC_JOBS_LIST_REVALIDATE_SECONDS, tags: [publicJobsListTag()] }
  )();
}

export function listJobCategories() {
  return unstable_cache(
    async () => {
      const rows = await prisma.job.findMany({
        where: { status: "ACTIVE", company: { verifiedStatus: "APPROVED" } },
        select: { category: true },
        distinct: ["category"],
        orderBy: { category: "asc" },
      });

      return rows.map((r) => r.category);
    },
    ["public-job-categories"],
    { revalidate: PUBLIC_JOB_CATEGORIES_REVALIDATE_SECONDS, tags: [publicJobsListTag()] }
  )();
}
