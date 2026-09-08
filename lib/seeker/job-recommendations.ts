import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { toMonthlyEquivalent, type SalaryPeriod } from "@/lib/shared/format";
import { baseActiveJobWhere } from "@/lib/jobs/public-listing";
import { seekerApplicationsTag, seekerProfileTag } from "@/lib/seeker/cache-tags";
import { publicJobsListTag } from "@/lib/public-cache-tags";
import { reviveDates } from "@/lib/cache-utils";

/**
 * Phase E1 — deterministic (non-AI) job-recommendation scorer for seekers.
 *
 * `scoreJobForSeeker` is a pure function (no Prisma, no Date.now()) so the
 * formula is unit-testable without a DB — same split as
 * lib/seeker/verification-score.ts vs lib/seeker/identity-verification.ts.
 * `getSeekerJobRecommendations` is the Prisma-backed wrapper the two seeker
 * Server Components (dashboard card + a future "recommended for you" page)
 * call directly.
 */

const RECOMMENDATIONS_REVALIDATE_SECONDS = 300;
// Bounded candidate pool per the repo-wide findMany take convention (see the
// INTERVIEWS_TAKE comment in lib/seeker/dashboard.ts).
const RECOMMENDATION_CANDIDATE_POOL_TAKE = 200;
/**
 * The score threshold alone is NOT sufficient to gate relevance: the
 * profile-independent components (location half/full credit, salary half
 * credit, recency, availability half credit) floor out around ~35 for ANY
 * recent remote job, even one that shares zero skills or headline overlap
 * with the seeker. That would let a "newest jobs" feed masquerade as
 * recommendations with reasons like "Fully remote / Posted 3 days ago". See
 * the `relevant` flag on `JobRecommendationScore` — a job must also match at
 * least one skill or headline token to be recommendable at all.
 */
const RECOMMENDATION_MIN_SCORE = 25;
const RECOMMENDATION_MAX_ITEMS = 20;
const RECENCY_DECAY_DAYS = 30;

/** Weights sum to 100. Exported so tests assert against the constant, not magic numbers (mirrors VERIFICATION_SCORE_WEIGHTS). */
export const RECOMMENDATION_WEIGHTS = {
  skills: 40,
  headline: 15,
  location: 15,
  salary: 15,
  recency: 10,
  availability: 5,
} as const;

const HEADLINE_STOPWORDS = new Set([
  "the", "and", "for", "with", "that", "this", "from", "have", "are", "was",
  "were", "you", "your", "our", "into", "then", "than", "also", "able",
  "who", "how", "what", "when", "where", "which", "who's", "will", "would",
  "can", "could", "not", "but", "all", "any", "one", "years", "year",
]);

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Builds a case-insensitive, boundary-safe "does this word/phrase appear in
 * this text" pattern. Plain `\b...\b` breaks for terms that start or end
 * with a non-word character (e.g. "C++", "Node.js" ends with an "s" so it's
 * fine, but "C++" ends with "+") because `\b` requires a word/non-word
 * transition and both sides of a trailing "+" are non-word characters — so
 * `\bC\+\+\b` would never match at all. Falling back to a negative
 * lookaround anchored on "not adjacent to a word character" keeps a
 * boundary-safe match without ever throwing on regex metacharacters (which
 * are escaped first).
 */
function buildBoundaryPattern(term: string): RegExp {
  const escaped = escapeRegExp(term);
  const start = /^\w/.test(term) ? "\\b" : "(?<!\\w)";
  const end = /\w$/.test(term) ? "\\b" : "(?!\\w)";
  return new RegExp(`${start}${escaped}${end}`, "i");
}

function normalizeSkill(skill: string): string {
  return skill.trim().toLowerCase().replace(/\s+/g, " ");
}

function usableNormalizedSkills(skills: string[]): string[] {
  return skills.map(normalizeSkill).filter((s) => s.length >= 2);
}

function hasHeadline(headline: string | null): boolean {
  return !!headline && headline.trim().length > 0;
}

function hasDesiredSalaryRange(min: number | null, max: number | null): boolean {
  return min != null || max != null;
}

export type RecommendationSeekerInput = {
  skills: string[];
  headline: string | null;
  location: string | null;
  desiredSalaryMin: number | null;
  desiredSalaryMax: number | null;
  availability: string | null;
};

export type RecommendationSignal = {
  key: "skills" | "headline" | "location" | "salary" | "availability";
  present: boolean;
  /** Max points this signal can contribute, from RECOMMENDATION_WEIGHTS. */
  weight: number;
};

/**
 * Derives which scorer inputs this seeker has actually filled in, so the UI
 * can show what's shaping their matches and what would sharpen them. Pure —
 * reuses the same predicates the scorer itself uses (`usableNormalizedSkills`,
 * `hasHeadline`, `hasDesiredSalaryRange`) so "present" here always agrees
 * with what actually earns points above. Ordered by descending weight;
 * there's deliberately no `recency` entry — that's a property of the job,
 * not something the seeker controls.
 */
export function recommendationSignals(seeker: RecommendationSeekerInput): RecommendationSignal[] {
  return [
    {
      key: "skills",
      present: usableNormalizedSkills(seeker.skills).length > 0,
      weight: RECOMMENDATION_WEIGHTS.skills,
    },
    {
      key: "headline",
      present: hasHeadline(seeker.headline),
      weight: RECOMMENDATION_WEIGHTS.headline,
    },
    {
      key: "location",
      present: !!seeker.location && seeker.location.trim().length > 0,
      weight: RECOMMENDATION_WEIGHTS.location,
    },
    {
      key: "salary",
      present: hasDesiredSalaryRange(seeker.desiredSalaryMin, seeker.desiredSalaryMax),
      weight: RECOMMENDATION_WEIGHTS.salary,
    },
    {
      key: "availability",
      present: !!seeker.availability && seeker.availability.trim().length > 0,
      weight: RECOMMENDATION_WEIGHTS.availability,
    },
  ];
}

export type RecommendationJobInput = {
  title: string;
  description: string;
  requirements: string | null;
  category: string;
  location: string;
  remoteType: string;
  employmentType: string;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryPeriod: string;
  publishedAt: Date | null;
  createdAt: Date;
};

export type JobRecommendationScore = {
  score: number;
  reasons: string[];
  /**
   * True only when the job has genuine topical relevance to this seeker
   * (skills.points > 0 || headline.points > 0) — i.e. something about the
   * job's actual content matched something the seeker actually said about
   * themselves, as opposed to just being remote/recent/salary-neutral.
   * Callers must gate on this in addition to the score threshold.
   */
  relevant: boolean;
};

type ReasonCandidate = {
  /** Actual (unrounded) points this component contributed — used to rank reasons, most-compelling first. */
  points: number;
  /** Fixed tie-break order for equal-points candidates (lower sorts first). */
  priority: number;
  text: string;
};

function scoreSkills(
  seeker: RecommendationSeekerInput,
  job: RecommendationJobInput
): { points: number; reason: string | null } {
  const weight = RECOMMENDATION_WEIGHTS.skills;
  const normalized = usableNormalizedSkills(seeker.skills);
  if (normalized.length === 0) return { points: 0, reason: null };

  const haystack = `${job.title} ${job.category} ${job.requirements ?? ""} ${job.description}`.toLowerCase();

  const matchedOriginal: string[] = [];
  seeker.skills.forEach((original) => {
    const normalizedSkill = normalizeSkill(original);
    if (normalizedSkill.length < 2) return;
    if (buildBoundaryPattern(normalizedSkill).test(haystack)) {
      matchedOriginal.push(original.trim());
    }
  });

  if (matchedOriginal.length === 0) return { points: 0, reason: null };

  const denominator = Math.min(5, normalized.length);
  const points = weight * Math.min(1, matchedOriginal.length / denominator);
  const namedSkills = matchedOriginal.slice(0, 3).join(", ");
  const reason = `Matches ${matchedOriginal.length} of your skills: ${namedSkills}`;
  return { points, reason };
}

function scoreHeadline(
  seeker: RecommendationSeekerInput,
  job: RecommendationJobInput
): { points: number; reason: string | null } {
  const weight = RECOMMENDATION_WEIGHTS.headline;
  if (!hasHeadline(seeker.headline)) return { points: 0, reason: null };

  const tokens = Array.from(
    new Set(
      (seeker.headline as string)
        .toLowerCase()
        .split(/[^a-z0-9+.#]+/i)
        .map((t) => t.trim())
        .filter((t) => t.length >= 3 && !HEADLINE_STOPWORDS.has(t))
    )
  );
  if (tokens.length === 0) return { points: 0, reason: null };

  const haystack = `${job.title} ${job.category}`.toLowerCase();
  const matchedCount = tokens.filter((token) => buildBoundaryPattern(token).test(haystack)).length;
  if (matchedCount === 0) return { points: 0, reason: null };

  const points = weight * Math.min(1, matchedCount / 3);
  return { points, reason: "Your headline matches this role" };
}

function scoreLocation(
  seeker: RecommendationSeekerInput,
  job: RecommendationJobInput
): { points: number; reason: string | null } {
  const weight = RECOMMENDATION_WEIGHTS.location;

  if (job.remoteType === "REMOTE") {
    return { points: weight, reason: "Fully remote" };
  }

  if (seeker.location && seeker.location.trim().length > 0) {
    const a = seeker.location.trim().toLowerCase();
    const b = job.location.trim().toLowerCase();
    if (a.length > 0 && b.length > 0 && (a.includes(b) || b.includes(a))) {
      return { points: weight, reason: "Located in your area" };
    }
    return { points: 0, reason: null };
  }

  // Unknown seeker location — don't punish, but it's not a "match" worth
  // surfacing as a reason either.
  return { points: weight / 2, reason: null };
}

function scoreSalary(
  seeker: RecommendationSeekerInput,
  job: RecommendationJobInput
): { points: number; reason: string | null } {
  const weight = RECOMMENDATION_WEIGHTS.salary;

  const jobHasSalary = job.salaryMin != null || job.salaryMax != null;
  const seekerHasRange = hasDesiredSalaryRange(seeker.desiredSalaryMin, seeker.desiredSalaryMax);

  if (!jobHasSalary || !seekerHasRange) {
    return { points: weight / 2, reason: null };
  }

  const period = job.salaryPeriod as SalaryPeriod;
  const jobMonthlyMin = job.salaryMin != null ? toMonthlyEquivalent(job.salaryMin, period) : null;
  const jobMonthlyMax = job.salaryMax != null ? toMonthlyEquivalent(job.salaryMax, period) : null;

  const jobLow = jobMonthlyMin ?? Number.NEGATIVE_INFINITY;
  const jobHigh = jobMonthlyMax ?? Number.POSITIVE_INFINITY;
  const seekLow = seeker.desiredSalaryMin ?? Number.NEGATIVE_INFINITY;
  const seekHigh = seeker.desiredSalaryMax ?? Number.POSITIVE_INFINITY;

  const overlaps = jobLow <= seekHigh && jobHigh >= seekLow;
  if (overlaps) {
    return { points: weight, reason: "Pay range fits your target" };
  }

  // Job's whole range sits strictly below what the seeker wants — a clear
  // mismatch, not merely "no overlap".
  if (jobHigh < seekLow) {
    return { points: 0, reason: null };
  }

  // Otherwise the job's range sits entirely above the seeker's target
  // (pays more than asked) — not a negative signal, just not a confirmed match.
  return { points: weight / 2, reason: null };
}

function scoreRecency(job: RecommendationJobInput, now: Date): { points: number; reason: string | null } {
  const weight = RECOMMENDATION_WEIGHTS.recency;
  const anchor = job.publishedAt ?? job.createdAt;
  const ageDays = (now.getTime() - anchor.getTime()) / (1000 * 60 * 60 * 24);
  const fraction = clamp(1 - ageDays / RECENCY_DECAY_DAYS, 0, 1);
  const points = weight * fraction;
  if (points <= 0) return { points: 0, reason: null };

  const roundedDays = Math.max(0, Math.round(ageDays));
  const reason = roundedDays === 0 ? "Posted today" : `Posted ${roundedDays} day${roundedDays === 1 ? "" : "s"} ago`;
  return { points, reason };
}

function scoreAvailability(
  seeker: RecommendationSeekerInput,
  job: RecommendationJobInput
): { points: number; reason: string | null } {
  const weight = RECOMMENDATION_WEIGHTS.availability;
  const availability = seeker.availability?.trim().toLowerCase() ?? "";
  if (!availability) return { points: weight / 2, reason: null };

  // Match the actual EmploymentType enum values (FULL_TIME, PART_TIME, CONTRACT — prisma/schema.prisma has no INTERNSHIP value).
  let matchedType: string | null = null;
  if (availability.includes("full")) matchedType = "FULL_TIME";
  else if (availability.includes("part")) matchedType = "PART_TIME";
  else if (availability.includes("contract") || availability.includes("freelance")) matchedType = "CONTRACT";

  if (!matchedType) return { points: weight / 2, reason: null };
  if (matchedType === job.employmentType) return { points: weight, reason: "Fits your availability" };
  return { points: 0, reason: null };
}

/**
 * Pure scorer: no DB, no wall-clock reads of its own (`now` is passed in).
 * Returns a 0-100 integer score plus up to 3 short, most-compelling-first
 * "why this matched" reasons, never mentioning a component that scored 0.
 */
export function scoreJobForSeeker(
  seeker: RecommendationSeekerInput,
  job: RecommendationJobInput,
  now: Date
): JobRecommendationScore {
  const skills = scoreSkills(seeker, job);
  const headline = scoreHeadline(seeker, job);
  const location = scoreLocation(seeker, job);
  const salary = scoreSalary(seeker, job);
  const recency = scoreRecency(job, now);
  const availability = scoreAvailability(seeker, job);

  const total = skills.points + headline.points + location.points + salary.points + recency.points + availability.points;
  const score = clamp(Math.round(total), 0, 100);

  const candidates: ReasonCandidate[] = [
    { points: skills.points, priority: 0, text: skills.reason ?? "" },
    { points: headline.points, priority: 1, text: headline.reason ?? "" },
    { points: location.points, priority: 2, text: location.reason ?? "" },
    { points: salary.points, priority: 3, text: salary.reason ?? "" },
    { points: recency.points, priority: 4, text: recency.reason ?? "" },
    { points: availability.points, priority: 5, text: availability.reason ?? "" },
  ].filter((c) => c.points > 0 && c.text.length > 0);

  candidates.sort((a, b) => (b.points !== a.points ? b.points - a.points : a.priority - b.priority));

  // The skills reason (priority 0) is the only reason naming something
  // concrete about the seeker, and it's half of the `relevant` gate — so
  // whenever it scored above zero, surface it first regardless of how its
  // points compare to the profile-independent components (location, recency,
  // etc). Everything else keeps the points-desc/priority ordering above.
  const skillsIndex = candidates.findIndex((c) => c.priority === 0);
  if (skillsIndex > 0) {
    const [skillsCandidate] = candidates.splice(skillsIndex, 1);
    candidates.unshift(skillsCandidate);
  }

  const reasons = candidates.slice(0, 3).map((c) => c.text);
  const relevant = skills.points > 0 || headline.points > 0;

  return { score, reasons, relevant };
}

// ---------------------------------------------------------------------------
// Prisma-backed wrapper
// ---------------------------------------------------------------------------

export type RecommendedJob = {
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
  company: {
    id: string;
    companyName: string;
    logoUrl: string | null;
    verifiedStatus: string;
    industry: string | null;
  };
  score: number;
  reasons: string[];
};

export type SeekerRecommendations =
  | { status: "ok"; items: RecommendedJob[]; signals: RecommendationSignal[] }
  | { status: "profile_incomplete"; items: []; signals: RecommendationSignal[] };

type RecommendationProfile = {
  id: string;
  skills: string[];
  headline: string | null;
  location: string | null;
  desiredSalaryMin: number | null;
  desiredSalaryMax: number | null;
  availability: string | null;
};

type CandidateJob = {
  id: string;
  title: string;
  description: string;
  requirements: string | null;
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
  expiresAt: Date | null;
  company: {
    id: string;
    companyName: string;
    logoUrl: string | null;
    verifiedStatus: string;
    industry: string | null;
  };
};

/**
 * Cold start: a profile with no usable skills, no headline, and no desired
 * salary range gives the scorer nothing meaningful to work with — surfacing
 * "recommendations" here would just be noise, so callers should show a
 * "complete your profile" prompt instead (`status: "profile_incomplete"`).
 */
function isColdStartProfile(profile: RecommendationProfile): boolean {
  const hasSkills = usableNormalizedSkills(profile.skills).length > 0;
  return !hasSkills && !hasHeadline(profile.headline) && !hasDesiredSalaryRange(profile.desiredSalaryMin, profile.desiredSalaryMax);
}

/**
 * The candidate job pool (with full descriptions, needed for skill matching)
 * is the same for every seeker on the board — it must NOT be cached per-user.
 * A per-user cache entry here would mean every seeker's data-cache entry
 * duplicates ~200 complete job descriptions, which is hundreds of KB of
 * near-identical content copied once per seeker instead of once for
 * everyone. Shared, user-independent cache key/tags on purpose.
 */
function fetchRecommendationCandidatePoolUncached(): Promise<CandidateJob[]> {
  return prisma.job.findMany({
    where: { AND: baseActiveJobWhere() },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: RECOMMENDATION_CANDIDATE_POOL_TAKE,
    select: {
      id: true,
      title: true,
      description: true,
      requirements: true,
      category: true,
      industry: true,
      employmentType: true,
      remoteType: true,
      location: true,
      salaryMin: true,
      salaryMax: true,
      salaryPeriod: true,
      publishedAt: true,
      createdAt: true,
      expiresAt: true,
      company: {
        select: { id: true, companyName: true, logoUrl: true, verifiedStatus: true, industry: true },
      },
    },
  });
}

function getRecommendationCandidatePool(): Promise<CandidateJob[]> {
  return unstable_cache(fetchRecommendationCandidatePoolUncached, ["seeker-recommendation-candidate-pool"], {
    revalidate: RECOMMENDATIONS_REVALIDATE_SECONDS,
    tags: [publicJobsListTag()],
  })();
}

async function fetchRecommendationProfileDataUncached(
  userId: string
): Promise<{ profile: RecommendationProfile | null; appliedJobIds: string[] }> {
  const profile = await prisma.seekerProfile.findUnique({
    where: { userId },
    select: {
      id: true,
      skills: true,
      headline: true,
      location: true,
      desiredSalaryMin: true,
      desiredSalaryMax: true,
      availability: true,
    },
  });

  if (!profile || isColdStartProfile(profile)) {
    return { profile, appliedJobIds: [] };
  }

  const appliedJobs = await prisma.application.findMany({
    where: { seekerId: profile.id },
    select: { jobId: true },
  });

  return { profile, appliedJobIds: appliedJobs.map((a) => a.jobId) };
}

function getRecommendationProfileData(
  userId: string
): Promise<{ profile: RecommendationProfile | null; appliedJobIds: string[] }> {
  return unstable_cache(
    () => fetchRecommendationProfileDataUncached(userId),
    ["seeker-job-recommendations-profile", userId],
    {
      revalidate: RECOMMENDATIONS_REVALIDATE_SECONDS,
      tags: [seekerProfileTag(userId), seekerApplicationsTag(userId)],
    }
  )();
}

/**
 * Returns up to 20 recommended jobs — score >= 25 AND `relevant` (a genuine
 * skill or headline match; see the comment on RECOMMENDATION_MIN_SCORE for
 * why the score threshold alone isn't enough) — highest score first. No
 * profile, or a "cold start" profile with nothing usable to score against,
 * yields `status: "profile_incomplete"` so the UI can show a profile-completion
 * prompt instead of low-quality noise.
 *
 * Reads two independently cached pieces in parallel: the candidate job pool
 * (shared across all seekers — see getRecommendationCandidatePool) and this
 * seeker's profile + applied-job ids (per-user — see
 * getRecommendationProfileData), then filters the shared pool down to this
 * seeker's unapplied jobs in memory.
 *
 * `now` is read here, outside both `unstable_cache` boundaries, and passed
 * into the pure scorer — the same pattern app/seeker/dashboard/page.tsx uses
 * for splitting interviews into upcoming/past — so a stale cached `now`
 * never skews the recency component on a cache hit.
 */
export async function getSeekerJobRecommendations(userId: string): Promise<SeekerRecommendations> {
  const now = new Date();

  const [pool, profileData] = await Promise.all([
    getRecommendationCandidatePool(),
    getRecommendationProfileData(userId),
  ]);
  const candidateJobs = reviveDates(pool);
  const { profile, appliedJobIds } = reviveDates(profileData);

  if (!profile) {
    // No seeker profile row at all — every signal is absent, not an empty
    // list, so the UI always has the full five to render.
    const emptySeekerInput: RecommendationSeekerInput = {
      skills: [],
      headline: null,
      location: null,
      desiredSalaryMin: null,
      desiredSalaryMax: null,
      availability: null,
    };
    return { status: "profile_incomplete", items: [], signals: recommendationSignals(emptySeekerInput) };
  }

  const seekerInput: RecommendationSeekerInput = {
    skills: profile.skills,
    headline: profile.headline,
    location: profile.location,
    desiredSalaryMin: profile.desiredSalaryMin,
    desiredSalaryMax: profile.desiredSalaryMax,
    availability: profile.availability,
  };
  const signals = recommendationSignals(seekerInput);

  if (isColdStartProfile(profile)) {
    return { status: "profile_incomplete", items: [], signals };
  }

  // NOTE: take: 200 (RECOMMENDATION_CANDIDATE_POOL_TAKE) is applied to the
  // shared pool BEFORE this per-seeker applied-jobs filter, so a seeker who
  // has applied to many of the newest jobs sees a slightly smaller effective
  // pool than one who hasn't. Acceptable for MVP — not a bug.
  const appliedJobIdSet = new Set(appliedJobIds);
  const jobs = candidateJobs.filter((job) => !appliedJobIdSet.has(job.id));

  const scored = jobs
    .map((job) => {
      const jobInput: RecommendationJobInput = {
        title: job.title,
        description: job.description,
        requirements: job.requirements,
        category: job.category,
        location: job.location,
        remoteType: job.remoteType,
        employmentType: job.employmentType,
        salaryMin: job.salaryMin,
        salaryMax: job.salaryMax,
        salaryPeriod: job.salaryPeriod,
        publishedAt: job.publishedAt,
        createdAt: job.createdAt,
      };
      const { score, reasons, relevant } = scoreJobForSeeker(seekerInput, jobInput, now);
      return { job, score, reasons, relevant };
    })
    .filter((entry) => entry.relevant && entry.score >= RECOMMENDATION_MIN_SCORE)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const createdDiff = b.job.createdAt.getTime() - a.job.createdAt.getTime();
      if (createdDiff !== 0) return createdDiff;
      return a.job.id < b.job.id ? 1 : a.job.id > b.job.id ? -1 : 0;
    })
    .slice(0, RECOMMENDATION_MAX_ITEMS);

  const items: RecommendedJob[] = scored.map(({ job, score, reasons }) => ({
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
    company: job.company,
    score,
    reasons,
  }));

  return { status: "ok", items, signals };
}

/** Thin wrapper over getSeekerJobRecommendations for the dashboard's "recommended for you" card. */
export async function getTopSeekerJobRecommendations(userId: string, limit = 3): Promise<SeekerRecommendations> {
  const result = await getSeekerJobRecommendations(userId);
  if (result.status !== "ok") return result;
  return { status: "ok", items: result.items.slice(0, limit), signals: result.signals };
}
