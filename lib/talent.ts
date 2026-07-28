import { prisma } from "@/lib/prisma";
import { Prisma } from "../prisma/gen/client";
import { ApiError } from "@/lib/api-error";
import { requireEmployerCompany } from "@/lib/employer-auth";
import { talentSearchSchema, savedSeekerSchema } from "@/lib/validations/talent-search";

export type TalentListItem = {
  id: string;
  fullName: string;
  headline: string | null;
  location: string | null;
  skills: string[];
  availability: string | null;
  yearsExperience: string | null;
  desiredSalaryMin: number | null;
  desiredSalaryMax: number | null;
  resumeUrl: string | null;
  saved: boolean;
};

type TalentSearchResult = {
  seekers: TalentListItem[];
  nextCursor: string | null;
};

function mapSeeker(
  seeker: {
    id: string;
    fullName: string;
    headline: string | null;
    location: string | null;
    skills: string[];
    availability: string | null;
    yearsExperience: string | null;
    desiredSalaryMin: number | null;
    desiredSalaryMax: number | null;
    resumeUrl: string | null;
  },
  savedIds: Set<string>
): TalentListItem {
  return {
    id: seeker.id,
    fullName: seeker.fullName,
    headline: seeker.headline,
    location: seeker.location,
    skills: seeker.skills,
    availability: seeker.availability,
    yearsExperience: seeker.yearsExperience,
    desiredSalaryMin: seeker.desiredSalaryMin,
    desiredSalaryMax: seeker.desiredSalaryMax,
    resumeUrl: seeker.resumeUrl,
    saved: savedIds.has(seeker.id),
  };
}

function buildSeekerWhere(input: ReturnType<typeof talentSearchSchema.parse>): Prisma.SeekerProfileWhereInput {
  const and: Prisma.SeekerProfileWhereInput[] = [{ profileVisibility: true }];

  if (input.skill) {
    and.push({ skills: { has: input.skill } });
  }
  if (input.location) {
    and.push({ location: { contains: input.location, mode: "insensitive" } });
  }
  if (input.availability) {
    and.push({ availability: input.availability });
  }
  if (input.q) {
    and.push({
      OR: [
        { fullName: { contains: input.q, mode: "insensitive" } },
        { headline: { contains: input.q, mode: "insensitive" } },
        { bio: { contains: input.q, mode: "insensitive" } },
        { skills: { hasSome: input.q.split(/\s+/).filter(Boolean) } },
      ],
    });
  }

  return { AND: and };
}

async function searchSeekersFts(
  companyId: string,
  input: ReturnType<typeof talentSearchSchema.parse>,
  savedIds: Set<string>
): Promise<TalentSearchResult> {
  const q = input.q!.trim();
  const limit = input.limit;

  type Row = {
    id: string;
    full_name: string;
    headline: string | null;
    location: string | null;
    skills: string[];
    availability: string | null;
    years_experience: string | null;
    desired_salary_min: number | null;
    desired_salary_max: number | null;
    resume_url: string | null;
    created_at: Date;
  };

  const rows = await prisma.$queryRaw<Row[]>`
    SELECT
      sp.id,
      sp.full_name,
      sp.headline,
      sp.location,
      sp.skills,
      sp.availability,
      sp.years_experience,
      sp.desired_salary_min,
      sp.desired_salary_max,
      sp.resume_url,
      sp.created_at
    FROM seeker_profiles sp
    WHERE sp.profile_visibility = true
      AND sp.search_vector @@ plainto_tsquery('english', ${q})
    ORDER BY ts_rank(sp.search_vector, plainto_tsquery('english', ${q})) DESC, sp.created_at DESC
    LIMIT ${limit + 1}
  `;

  const hasMore = rows.length > limit;
  const slice = hasMore ? rows.slice(0, limit) : rows;

  return {
    seekers: slice.map((r) =>
      mapSeeker(
        {
          id: r.id,
          fullName: r.full_name,
          headline: r.headline,
          location: r.location,
          skills: r.skills,
          availability: r.availability,
          yearsExperience: r.years_experience,
          desiredSalaryMin: r.desired_salary_min,
          desiredSalaryMax: r.desired_salary_max,
          resumeUrl: r.resume_url,
        },
        savedIds
      )
    ),
    nextCursor: hasMore ? slice[slice.length - 1]?.id ?? null : null,
  };
}

export async function searchTalent(employerUserId: string, raw: unknown): Promise<TalentSearchResult> {
  const input = talentSearchSchema.parse(raw);
  const company = await requireEmployerCompany(employerUserId);

  const saved = await prisma.savedSeeker.findMany({
    where: { companyId: company.id },
    select: { seekerId: true },
  });
  const savedIds = new Set(saved.map((s) => s.seekerId));

  if (input.q) {
    try {
      return await searchSeekersFts(company.id, input, savedIds);
    } catch {
      // Fall back if search_vector migration is not applied yet.
    }
  }

  const where = buildSeekerWhere(input);
  const seekers = await prisma.seekerProfile.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: input.limit + 1,
    ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
    select: {
      id: true,
      fullName: true,
      headline: true,
      location: true,
      skills: true,
      availability: true,
      yearsExperience: true,
      desiredSalaryMin: true,
      desiredSalaryMax: true,
      resumeUrl: true,
    },
  });

  const hasMore = seekers.length > input.limit;
  const page = hasMore ? seekers.slice(0, input.limit) : seekers;

  return {
    seekers: page.map((s) => mapSeeker(s, savedIds)),
    nextCursor: hasMore ? page[page.length - 1]?.id ?? null : null,
  };
}

export async function listSavedSeekers(employerUserId: string) {
  const company = await requireEmployerCompany(employerUserId);

  const saved = await prisma.savedSeeker.findMany({
    where: { companyId: company.id },
    orderBy: { savedAt: "desc" },
    include: {
      seeker: {
        select: {
          id: true,
          fullName: true,
          headline: true,
          location: true,
          skills: true,
          availability: true,
          yearsExperience: true,
          desiredSalaryMin: true,
          desiredSalaryMax: true,
          resumeUrl: true,
        },
      },
    },
  });

  const savedIds = new Set(saved.map((s) => s.seekerId));
  return saved.map((s) => mapSeeker(s.seeker, savedIds));
}

export async function saveSeeker(employerUserId: string, raw: unknown) {
  const input = savedSeekerSchema.parse(raw);
  const company = await requireEmployerCompany(employerUserId);

  const seeker = await prisma.seekerProfile.findFirst({
    where: { id: input.seekerId, profileVisibility: true },
  });

  if (!seeker) {
    throw new ApiError("Seeker not found", 404);
  }

  await prisma.savedSeeker.upsert({
    where: {
      companyId_seekerId: { companyId: company.id, seekerId: seeker.id },
    },
    create: { companyId: company.id, seekerId: seeker.id },
    update: {},
  });

  return { ok: true };
}

export async function unsaveSeeker(employerUserId: string, seekerId: string) {
  const company = await requireEmployerCompany(employerUserId);

  await prisma.savedSeeker.deleteMany({
    where: { companyId: company.id, seekerId },
  });

  return { ok: true };
}
