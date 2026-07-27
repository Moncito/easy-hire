import { prisma } from "@/lib/prisma";
import { Prisma } from "../prisma/generated/client";
import type { JobSearchInput } from "@/lib/validations/job-search";
import { ApiError } from "@/lib/api-error";

export type PublicJobListItem = {
  id: string;
  title: string;
  category: string;
  employmentType: string;
  remoteType: string;
  location: string;
  salaryMin: number | null;
  salaryMax: number | null;
  publishedAt: string | null;
  createdAt: string;
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

function activeJobWhere(input: JobSearchInput): Prisma.JobWhereInput {
  const now = new Date();
  const andClauses: Prisma.JobWhereInput[] = [
    { status: "ACTIVE" },
    { OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
    { company: { verifiedStatus: "APPROVED" } },
  ];

  if (input.category) andClauses.push({ category: input.category });
  if (input.employmentType) andClauses.push({ employmentType: input.employmentType });
  if (input.remoteType) andClauses.push({ remoteType: input.remoteType });
  if (input.salaryMin != null) {
    andClauses.push({
      OR: [{ salaryMax: { gte: input.salaryMin } }, { salaryMax: null, salaryMin: { gte: input.salaryMin } }],
    });
  }
  if (input.salaryMax != null) {
    andClauses.push({
      OR: [{ salaryMin: { lte: input.salaryMax } }, { salaryMin: null }],
    });
  }
  if (input.q) {
    andClauses.push({
      OR: [
        { title: { contains: input.q, mode: "insensitive" } },
        { description: { contains: input.q, mode: "insensitive" } },
        { category: { contains: input.q, mode: "insensitive" } },
        { requirements: { contains: input.q, mode: "insensitive" } },
      ],
    });
  }

  return { AND: andClauses };
}

function mapJob(job: {
  id: string;
  title: string;
  category: string;
  employmentType: string;
  remoteType: string;
  location: string;
  salaryMin: number | null;
  salaryMax: number | null;
  publishedAt: Date | null;
  createdAt: Date;
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
    employmentType: job.employmentType,
    remoteType: job.remoteType,
    location: job.location,
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax,
    publishedAt: job.publishedAt?.toISOString() ?? null,
    createdAt: job.createdAt.toISOString(),
    company: job.company,
  };
}

export async function searchPublicJobs(input: JobSearchInput): Promise<SearchResult> {
  if (input.q) {
    try {
      return await searchPublicJobsFts(input);
    } catch {
      // Fall back if search_vector migration is not applied yet.
    }
  }

  return searchPublicJobsPrisma(input);
}

async function searchPublicJobsPrisma(input: JobSearchInput): Promise<SearchResult> {
  const limit = input.limit;
  const cursorJob = input.cursor
    ? await prisma.job.findFirst({
        where: { id: input.cursor, status: "ACTIVE" },
        select: { id: true, createdAt: true },
      })
    : null;

  const jobs = await prisma.job.findMany({
    where: {
      AND: [
        activeJobWhere(input),
        ...(cursorJob
          ? [
              {
                OR: [
                  { createdAt: { lt: cursorJob.createdAt } },
                  { createdAt: cursorJob.createdAt, id: { lt: cursorJob.id } },
                ],
              },
            ]
          : []),
      ],
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit + 1,
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
        select: { createdAt: true, id: true },
      })
    : null;

  type RawRow = {
    id: string;
    title: string;
    category: string;
    employment_type: string;
    remote_type: string;
    location: string;
    salary_min: number | null;
    salary_max: number | null;
    published_at: Date | null;
    created_at: Date;
    company_id: string;
    company_name: string;
    logo_url: string | null;
    verified_status: string;
    industry: string | null;
  };

  const rows = await prisma.$queryRaw<RawRow[]>`
    SELECT
      j.id,
      j.title,
      j.category,
      j.employment_type,
      j.remote_type,
      j.location,
      j.salary_min,
      j.salary_max,
      j.published_at,
      j.created_at,
      c.id AS company_id,
      c.company_name,
      c.logo_url,
      c.verified_status,
      c.industry
    FROM jobs j
    INNER JOIN companies c ON c.id = j.company_id
    WHERE j.status = 'ACTIVE'
      AND (j.expires_at IS NULL OR j.expires_at > NOW())
      AND c.verified_status = 'APPROVED'
      AND j.search_vector @@ plainto_tsquery('english', ${q})
      ${input.category ? Prisma.sql`AND j.category = ${input.category}` : Prisma.empty}
      ${input.employmentType ? Prisma.sql`AND j.employment_type = ${input.employmentType}::"EmploymentType"` : Prisma.empty}
      ${input.remoteType ? Prisma.sql`AND j.remote_type = ${input.remoteType}::"RemoteType"` : Prisma.empty}
      ${
        cursorJob
          ? Prisma.sql`AND (j.created_at, j.id) < (${cursorJob.createdAt}, ${cursorJob.id})`
          : Prisma.empty
      }
    ORDER BY j.created_at DESC, j.id DESC
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
        employmentType: row.employment_type,
        remoteType: row.remote_type,
        location: row.location,
        salaryMin: row.salary_min,
        salaryMax: row.salary_max,
        publishedAt: row.published_at,
        createdAt: row.created_at,
        company: {
          id: row.company_id,
          companyName: row.company_name,
          logoUrl: row.logo_url,
          verifiedStatus: row.verified_status,
          industry: row.industry,
        },
      })
    ),
    nextCursor: hasMore ? page[page.length - 1]?.id ?? null : null,
  };
}

export async function getPublicJob(jobId: string) {
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
          description: true,
          website: true,
          industry: true,
          verifiedStatus: true,
          headquarters: true,
          highlights: true,
        },
      },
    },
  });

  if (!job) {
    throw new ApiError("Job not found", 404);
  }

  return job;
}

export async function listJobCategories() {
  const rows = await prisma.job.findMany({
    where: { status: "ACTIVE", company: { verifiedStatus: "APPROVED" } },
    select: { category: true },
    distinct: ["category"],
    orderBy: { category: "asc" },
  });

  return rows.map((r) => r.category);
}
