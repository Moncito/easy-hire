import { Prisma, type VerificationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ROLLUP_BATCH_SIZE } from "@/lib/employer/analytics-rollups";
import { PUBLIC_REVIEW_STATUSES } from "@/lib/reviews";
import { getSeekerProfileCompletion, type SeekerProfileCompletionInput } from "@/lib/seeker/profile-completion";

/**
 * CONTINUOUS TRUST SCORING — docs/ADMIN-CONSOLE-PLAN.md §4.8 / §7.3, build-plan.md
 * "Sprint 10 — approved (admin console Phase 0, 2026-09-09)". Nightly cron
 * recomputes `trustScore` + `trustSignals` on `SeekerProfile` / `Company` for
 * accounts with activity in the last 24h. "This is the feature that beats
 * OnlineJobs.ph's one-time ID check — a verified account that starts
 * behaving badly surfaces automatically" (plan §4.8).
 *
 * THE TWO RULES THAT MATTER MOST (see each component below):
 *   1. A missing signal is never a penalty. Every component with a minimum
 *      sample size contributes exactly 0 when the gate isn't met — never a
 *      negative number. A brand-new account with no history must land at or
 *      near the 60 baseline, never in a risk band.
 *   2. `trustSignals` must explain the score: every component is stored as a
 *      named entry with its computed contribution and the (non-PII) inputs
 *      that drove it, plus the weights version, so a score is always
 *      auditable in the admin UI.
 *
 * Same minimum-sample precedent as lib/employer/response-metrics.ts's
 * `RESPONSE_METRICS_MIN_SAMPLE` gate: never publish a signal derived from a
 * handful of data points.
 *
 * PERFORMANCE (§10 of the plan): this runs nightly over potentially
 * thousands of accounts. Every component below is computed with ONE
 * aggregate query across ALL candidate accounts (groupBy or a batched raw
 * SQL query keyed by the candidate id), then joined in memory per account —
 * never a query per account. The only per-account work is the final
 * `update` (each account's score/signals genuinely differ), which is itself
 * batched in chunks of `ROLLUP_BATCH_SIZE` via `Promise.allSettled`, the
 * same shape as `runResponseMetricsForAllCompanies` /
 * `runDailyRollupsForAllCompanies`.
 */

// ============================================================================
// Weights — the single source of truth. Tuning the score later is a change
// to this object only, never a migration: `trustScore`/`trustSignals` are
// plain Int/Json columns with no weight baked into the schema.
// ============================================================================

/** Bump whenever a weight or threshold below changes, so a `trustSignals` payload computed under old weights is identifiable later (see `weightsVersion` in the persisted payload). */
export const TRUST_WEIGHTS_VERSION = 1;

export const TRUST_WEIGHTS = {
  /** Every score starts here. Higher = more trustworthy. Clamped to [0, 100] after all components are summed. */
  baseline: 60,
  min: 0,
  max: 100,

  seeker: {
    /** ID verification state (`SeekerProfile.idVerificationStatus`). Unlike every gated component below, this is a real signal even when "missing" — a seeker who has never submitted an ID is a deliberate, spec'd negative, not a sample-size gate. `PENDING` (submitted, awaiting review) contributes 0 — neither rewarded nor punished while an admin hasn't acted yet. */
    idVerified: {
      approvedBonus: 20,
      rejectedPenalty: -25,
      notSubmittedPenalty: -5,
    },
    /** `SeekerProfile.verificationScore` (0-100, already computed by lib/seeker/verification-score.ts) scaled down to a max contribution here — never recomputed, only read and scaled. */
    verificationScoreMaxContribution: 10,
    /** Profile completeness bonus, gated on the completion percentage itself (not a sample size) — always computable, so this is never gated to 0 for "missing data," only for genuinely incomplete profiles. */
    profileComplete: { thresholdPercent: 80, bonus: 5 },
    /** Account age bonus — always computable from `createdAt`, never gated. */
    accountAge: { thresholdDays: 90, bonus: 5 },
    /** Application spray rate = total applications / distinct days with >=1 application. Gated on active days, not account age or application count, because a rate needs multiple independent days to mean anything — a single binge day is not evidence either way. */
    spray: { minActiveDays: 3, highRatePerDay: 20, highPenalty: -20, moderateRatePerDay: 10, moderatePenalty: -10 },
    /** Rejection rate = REJECTED applications / total applications, all-time. */
    rejectionRate: { minApplications: 10, thresholdPercent: 80, penalty: -10 },
    /** Average review rating received, from PUBLISHED/DISPUTED reviews only (same `PUBLIC_REVIEW_STATUSES` as every public rating surface). */
    reviews: { minReviews: 3, goodThreshold: 4.5, goodBonus: 10, badThreshold: 2.5, badPenalty: -15 },
    /** `AbuseReport` with `status = 'ACTIONED'` targeting this account (`targetType = 'USER'`, `targetId = User.id`). Zero reports today contributes exactly 0 — the floor only ever makes the penalty less negative than a naive per-report multiply, never more. */
    abuseReports: { penaltyPerUpheld: -15, floor: -45 },
  },

  employer: {
    /** Company verification state (`Company.verifiedStatus`). Unlike the seeker side, `PENDING` (the default at creation) is NOT separately penalized — every company starts PENDING, so treating that as a penalty would punish every brand-new employer by definition. Only an explicit admin REJECTED costs points. */
    verified: { approvedBonus: 20, rejectedPenalty: -25 },
    /** Reuses `Company.responseRate` / `responseSampleSize` — both already recomputed nightly by `runResponseMetricsForAllCompanies` (lib/employer/response-metrics.ts) over a rolling 90-day window. Never recomputed here. `minSample` here (10) is a STRICTER gate than that module's own publish gate (`RESPONSE_METRICS_MIN_SAMPLE` = 5) — a rate can be public-facing at a smaller sample than it takes to move a trust score. */
    responseRate: { minSample: 10, goodThresholdPercent: 80, goodBonus: 10, badThresholdPercent: 30, badPenalty: -15 },
    /** Ghosting = applications still `APPLIED` more than `graceDays` after `appliedAt`. The denominator is applications old enough to judge (`appliedAt` older than `graceDays` ago), not every application ever — a fresh application can't yet be "ghosted," and counting it would dilute a genuine ghoster's rate downward, same reasoning as the grace period in lib/employer/response-metrics.ts. */
    ghosting: { graceDays: 14, minApplications: 10, thresholdPercent: 50, penalty: -20 },
    /** `AdminAuditLog` rows with `action = 'JOB_REJECT'`, `targetType = 'JOB'`, in the trailing `windowDays`. Zero rejections contributes exactly 0; the floor only bounds how negative repeated rejections can push this one component. */
    jobRejections: { windowDays: 90, penaltyPerRejection: -5, floor: -20 },
    reviews: { minReviews: 3, goodThreshold: 4.5, goodBonus: 10, badThreshold: 2.5, badPenalty: -15 },
    /** Same shape as the seeker side, but `targetType = 'COMPANY'`, `targetId = Company.id`. */
    abuseReports: { penaltyPerUpheld: -15, floor: -45 },
  },
} as const;

function clampScore(value: number): number {
  return Math.min(TRUST_WEIGHTS.max, Math.max(TRUST_WEIGHTS.min, value));
}

// ============================================================================
// Shared shapes
// ============================================================================

/** One scored component. `inputs` holds only counts/rates/enums — never PII — so the admin UI can render "why" without a second lookup. */
export type TrustComponent = {
  key: string;
  contribution: number;
  inputs: Record<string, number | string | boolean | null>;
};

/** The full persisted `trustSignals` payload — self-describing, versioned, and sums to `score` exactly (`baseline + sum(components.contribution)`, clamped). */
export type TrustComputation = {
  score: number;
  baseline: number;
  weightsVersion: number;
  computedAt: string;
  components: TrustComponent[];
};

function sumContributions(components: TrustComponent[]): number {
  return components.reduce((sum, c) => sum + c.contribution, 0);
}

// ============================================================================
// SEEKER — pure scoring function. No Prisma import in this function's
// signature/body (only in the batch fetcher below), so the formula is
// unit-testable without a DB, same precedent as
// lib/employer/response-metrics.ts's `computeResponseMetrics`.
// ============================================================================

export type SeekerTrustInput = {
  idVerificationStatus: VerificationStatus | null;
  verificationScore: number;
  profileCompletionPercent: number;
  accountAgeDays: number;
  applicationStats: { totalApplications: number; activeDays: number; rejectedCount: number };
  reviewStats: { average: number | null; count: number };
  upheldAbuseReportCount: number;
};

export function computeSeekerTrustScore(input: SeekerTrustInput, now: Date = new Date()): TrustComputation {
  const w = TRUST_WEIGHTS.seeker;
  const components: TrustComponent[] = [];

  // ID verification — see the weight's doc comment: "not submitted" is a
  // real, spec'd penalty, not a sample-size gate.
  let idContribution = 0;
  if (input.idVerificationStatus === "APPROVED") idContribution = w.idVerified.approvedBonus;
  else if (input.idVerificationStatus === "REJECTED") idContribution = w.idVerified.rejectedPenalty;
  else if (input.idVerificationStatus === null) idContribution = w.idVerified.notSubmittedPenalty;
  // PENDING falls through with idContribution = 0.
  components.push({
    key: "idVerification",
    contribution: idContribution,
    inputs: { status: input.idVerificationStatus },
  });

  // verificationScore (0-100) scaled to at most +verificationScoreMaxContribution.
  const clampedVerificationScore = Math.min(100, Math.max(0, input.verificationScore));
  const verificationContribution = Math.round(
    (clampedVerificationScore / 100) * w.verificationScoreMaxContribution
  );
  components.push({
    key: "verificationScore",
    contribution: verificationContribution,
    inputs: { verificationScore: input.verificationScore },
  });

  // Profile completeness.
  const profileContribution =
    input.profileCompletionPercent >= w.profileComplete.thresholdPercent ? w.profileComplete.bonus : 0;
  components.push({
    key: "profileCompleteness",
    contribution: profileContribution,
    inputs: {
      profileCompletionPercent: input.profileCompletionPercent,
      gateThresholdPercent: w.profileComplete.thresholdPercent,
    },
  });

  // Account age.
  const ageContribution = input.accountAgeDays >= w.accountAge.thresholdDays ? w.accountAge.bonus : 0;
  components.push({
    key: "accountAge",
    contribution: ageContribution,
    inputs: { accountAgeDays: input.accountAgeDays, gateThresholdDays: w.accountAge.thresholdDays },
  });

  // Application spray rate — gated on active days (RULE 1: gate not met -> 0).
  const { totalApplications, activeDays, rejectedCount } = input.applicationStats;
  let sprayContribution = 0;
  let sprayRatePerDay: number | null = null;
  if (activeDays >= w.spray.minActiveDays) {
    sprayRatePerDay = totalApplications / activeDays;
    if (sprayRatePerDay > w.spray.highRatePerDay) sprayContribution = w.spray.highPenalty;
    else if (sprayRatePerDay > w.spray.moderateRatePerDay) sprayContribution = w.spray.moderatePenalty;
  }
  components.push({
    key: "applicationSprayRate",
    contribution: sprayContribution,
    inputs: {
      totalApplications,
      activeDays,
      ratePerDay: sprayRatePerDay,
      gateMinActiveDays: w.spray.minActiveDays,
    },
  });

  // Rejection rate — gated on total applications (RULE 1: gate not met -> 0).
  let rejectionContribution = 0;
  let rejectionRatePercent: number | null = null;
  if (totalApplications >= w.rejectionRate.minApplications) {
    rejectionRatePercent = (rejectedCount / totalApplications) * 100;
    if (rejectionRatePercent > w.rejectionRate.thresholdPercent) rejectionContribution = w.rejectionRate.penalty;
  }
  components.push({
    key: "rejectionRate",
    contribution: rejectionContribution,
    inputs: {
      totalApplications,
      rejectedCount,
      rejectionRatePercent,
      gateMinApplications: w.rejectionRate.minApplications,
    },
  });

  // Average review rating — gated on review count (RULE 1: gate not met -> 0).
  let reviewContribution = 0;
  const { average, count } = input.reviewStats;
  if (count >= w.reviews.minReviews && average !== null) {
    if (average >= w.reviews.goodThreshold) reviewContribution = w.reviews.goodBonus;
    else if (average < w.reviews.badThreshold) reviewContribution = w.reviews.badPenalty;
  }
  components.push({
    key: "reviews",
    contribution: reviewContribution,
    inputs: { averageRating: average, reviewCount: count, gateMinReviews: w.reviews.minReviews },
  });

  // Upheld abuse reports — zero reports contributes exactly 0 (RULE 1).
  const abuseContribution = Math.max(
    w.abuseReports.floor,
    input.upheldAbuseReportCount * w.abuseReports.penaltyPerUpheld
  );
  components.push({
    key: "upheldAbuseReports",
    contribution: abuseContribution,
    inputs: { upheldReportCount: input.upheldAbuseReportCount, floor: w.abuseReports.floor },
  });

  const score = clampScore(TRUST_WEIGHTS.baseline + sumContributions(components));

  return {
    score,
    baseline: TRUST_WEIGHTS.baseline,
    weightsVersion: TRUST_WEIGHTS_VERSION,
    computedAt: now.toISOString(),
    components,
  };
}

// ============================================================================
// EMPLOYER — pure scoring function, same shape as the seeker one above.
// ============================================================================

export type EmployerTrustInput = {
  verifiedStatus: VerificationStatus;
  responseRate: number | null;
  responseSampleSize: number | null;
  ghostingStats: { eligibleApplications: number; ghostedApplications: number };
  jobRejectionCount90d: number;
  reviewStats: { average: number | null; count: number };
  upheldAbuseReportCount: number;
};

export function computeEmployerTrustScore(input: EmployerTrustInput, now: Date = new Date()): TrustComputation {
  const w = TRUST_WEIGHTS.employer;
  const components: TrustComponent[] = [];

  // Verification state — PENDING (the default) is deliberately NOT penalized; see the weight's doc comment.
  let verifiedContribution = 0;
  if (input.verifiedStatus === "APPROVED") verifiedContribution = w.verified.approvedBonus;
  else if (input.verifiedStatus === "REJECTED") verifiedContribution = w.verified.rejectedPenalty;
  components.push({
    key: "companyVerification",
    contribution: verifiedContribution,
    inputs: { status: input.verifiedStatus },
  });

  // Response rate — gated on sample size (RULE 1: gate not met -> 0).
  let responseContribution = 0;
  const sampleSize = input.responseSampleSize ?? 0;
  if (sampleSize >= w.responseRate.minSample && input.responseRate !== null) {
    if (input.responseRate >= w.responseRate.goodThresholdPercent) responseContribution = w.responseRate.goodBonus;
    else if (input.responseRate < w.responseRate.badThresholdPercent) responseContribution = w.responseRate.badPenalty;
  }
  components.push({
    key: "responseRate",
    contribution: responseContribution,
    inputs: {
      responseRatePercent: input.responseRate,
      sampleSize,
      gateMinSample: w.responseRate.minSample,
    },
  });

  // Ghosting rate — gated on eligible (old enough to judge) applications (RULE 1: gate not met -> 0).
  let ghostingContribution = 0;
  let ghostingRatePercent: number | null = null;
  const { eligibleApplications, ghostedApplications } = input.ghostingStats;
  if (eligibleApplications >= w.ghosting.minApplications) {
    ghostingRatePercent = (ghostedApplications / eligibleApplications) * 100;
    if (ghostingRatePercent > w.ghosting.thresholdPercent) ghostingContribution = w.ghosting.penalty;
  }
  components.push({
    key: "ghostingRate",
    contribution: ghostingContribution,
    inputs: {
      eligibleApplications,
      ghostedApplications,
      ghostingRatePercent,
      gateMinApplications: w.ghosting.minApplications,
      graceDays: w.ghosting.graceDays,
    },
  });

  // Admin job rejections in the trailing window — zero contributes exactly 0 (RULE 1).
  const jobRejectionContribution = Math.max(
    w.jobRejections.floor,
    input.jobRejectionCount90d * w.jobRejections.penaltyPerRejection
  );
  components.push({
    key: "adminJobRejections",
    contribution: jobRejectionContribution,
    inputs: {
      rejectionCount: input.jobRejectionCount90d,
      windowDays: w.jobRejections.windowDays,
      floor: w.jobRejections.floor,
    },
  });

  // Average review rating — gated on review count (RULE 1: gate not met -> 0).
  let reviewContribution = 0;
  const { average, count } = input.reviewStats;
  if (count >= w.reviews.minReviews && average !== null) {
    if (average >= w.reviews.goodThreshold) reviewContribution = w.reviews.goodBonus;
    else if (average < w.reviews.badThreshold) reviewContribution = w.reviews.badPenalty;
  }
  components.push({
    key: "reviews",
    contribution: reviewContribution,
    inputs: { averageRating: average, reviewCount: count, gateMinReviews: w.reviews.minReviews },
  });

  // Upheld abuse reports — zero reports contributes exactly 0 (RULE 1).
  const abuseContribution = Math.max(
    w.abuseReports.floor,
    input.upheldAbuseReportCount * w.abuseReports.penaltyPerUpheld
  );
  components.push({
    key: "upheldAbuseReports",
    contribution: abuseContribution,
    inputs: { upheldReportCount: input.upheldAbuseReportCount, floor: w.abuseReports.floor },
  });

  const score = clampScore(TRUST_WEIGHTS.baseline + sumContributions(components));

  return {
    score,
    baseline: TRUST_WEIGHTS.baseline,
    weightsVersion: TRUST_WEIGHTS_VERSION,
    computedAt: now.toISOString(),
    components,
  };
}

// ============================================================================
// Batched DB reads + writes. Every read below is ONE query across ALL
// candidate ids passed in — never a query per account. See the file header's
// PERFORMANCE note.
// ============================================================================

type SeekerApplicationStatsRow = {
  seeker_id: string;
  total_applications: number;
  active_days: number;
  rejected_count: number;
};

type SeekerTrustResult = { id: string; computation: TrustComputation };

/**
 * Recomputes + persists trust scores for exactly the given `seekerProfileIds`.
 * Five batched reads total (base fields, application stats, reviews, abuse
 * reports — the base-fields query already carries everything needed for
 * profile completeness/age/id-verification/verificationScore), then one
 * write per account, chunked through `ROLLUP_BATCH_SIZE`.
 */
async function recomputeSeekerTrustScoresBatch(seekerProfileIds: string[]): Promise<SeekerTrustResult[]> {
  if (seekerProfileIds.length === 0) return [];

  const profiles = await prisma.seekerProfile.findMany({
    where: { id: { in: seekerProfileIds } },
    select: {
      id: true,
      userId: true,
      createdAt: true,
      idVerificationStatus: true,
      verificationScore: true,
      fullName: true,
      headline: true,
      bio: true,
      location: true,
      photoUrl: true,
      resumeUrl: true,
      skills: true,
      yearsExperience: true,
      availability: true,
      desiredSalaryMin: true,
      desiredSalaryMax: true,
      timezone: true,
      languages: true,
      workExperience: true,
      education: true,
      linkedinUrl: true,
      portfolioUrl: true,
      certifications: true,
      visibility: true,
    },
  });
  if (profiles.length === 0) return [];

  const seekerIds = profiles.map((p) => p.id);
  const userIds = profiles.map((p) => p.userId);

  // One raw query for BOTH spray-rate inputs (total applications, distinct
  // active days) AND the rejection-rate input (rejected count) per seeker —
  // COUNT(DISTINCT date_trunc(...)) has no Prisma groupBy equivalent, so
  // this one is hand-written SQL rather than two separate Prisma queries.
  const applicationStatsRows = await prisma.$queryRaw<SeekerApplicationStatsRow[]>`
    SELECT seeker_id,
           COUNT(*)::int AS total_applications,
           COUNT(DISTINCT date_trunc('day', applied_at))::int AS active_days,
           COUNT(*) FILTER (WHERE status = 'REJECTED')::int AS rejected_count
    FROM applications
    WHERE seeker_id = ANY(${seekerIds})
    GROUP BY seeker_id
  `;
  const applicationStatsById = new Map(applicationStatsRows.map((r) => [r.seeker_id, r]));

  const reviewRows = await prisma.review.groupBy({
    by: ["subjectSeekerId"],
    where: { subjectSeekerId: { in: seekerIds }, status: { in: PUBLIC_REVIEW_STATUSES } },
    _avg: { rating: true },
    _count: { _all: true },
  });
  const reviewStatsById = new Map(
    reviewRows
      .filter((r): r is typeof r & { subjectSeekerId: string } => r.subjectSeekerId !== null)
      .map((r) => [r.subjectSeekerId, { average: r._avg.rating, count: r._count._all }])
  );

  // AbuseReport targets a seeker account via targetType 'USER' + targetId = User.id (there is no
  // separate 'SEEKER' target type — see prisma/schema.prisma's AbuseReport comment).
  const abuseRows = await prisma.abuseReport.groupBy({
    by: ["targetId"],
    where: { targetType: "USER", targetId: { in: userIds }, status: "ACTIONED" },
    _count: { _all: true },
  });
  const abuseCountByUserId = new Map(abuseRows.map((r) => [r.targetId, r._count._all]));

  const now = new Date();

  const results: SeekerTrustResult[] = profiles.map((profile) => {
    const completion = getSeekerProfileCompletion(profile as SeekerProfileCompletionInput);
    const profileCompletionPercent = completion.total > 0 ? Math.round((completion.completed / completion.total) * 100) : 0;
    const accountAgeDays = Math.floor((now.getTime() - profile.createdAt.getTime()) / (1000 * 60 * 60 * 24));
    const appStats = applicationStatsById.get(profile.id);
    const reviewStats = reviewStatsById.get(profile.id) ?? { average: null, count: 0 };
    const upheldAbuseReportCount = abuseCountByUserId.get(profile.userId) ?? 0;

    const computation = computeSeekerTrustScore(
      {
        idVerificationStatus: profile.idVerificationStatus,
        verificationScore: profile.verificationScore,
        profileCompletionPercent,
        accountAgeDays,
        applicationStats: {
          totalApplications: appStats?.total_applications ?? 0,
          activeDays: appStats?.active_days ?? 0,
          rejectedCount: appStats?.rejected_count ?? 0,
        },
        reviewStats,
        upheldAbuseReportCount,
      },
      now
    );

    return { id: profile.id, computation };
  });

  await writeTrustResults(results, (id, data) => prisma.seekerProfile.update({ where: { id }, data }));

  return results;
}

type EmployerGhostingRow = { company_id: string; eligible: number; ghosted: number };
type EmployerJobRejectionRow = { company_id: string; rejections: number };
type EmployerTrustResult = { id: string; computation: TrustComputation };

/**
 * Recomputes + persists trust scores for exactly the given `companyIds`.
 * Five batched reads total (base fields incl. the already-denormalized
 * response metrics, ghosting via one raw join query, admin job rejections
 * via one raw join query, reviews, abuse reports), then one write per
 * account, chunked through `ROLLUP_BATCH_SIZE`.
 */
async function recomputeEmployerTrustScoresBatch(companyIds: string[]): Promise<EmployerTrustResult[]> {
  if (companyIds.length === 0) return [];

  const companies = await prisma.company.findMany({
    where: { id: { in: companyIds } },
    select: { id: true, verifiedStatus: true, responseRate: true, responseSampleSize: true },
  });
  if (companies.length === 0) return [];

  const foundIds = companies.map((c) => c.id);

  // Ghosting: applications more than `graceDays` old, still APPLIED, per company —
  // requires joining through Job (Application has no companyId column), so this is
  // one hand-written SQL join rather than a Prisma groupBy (which can't join).
  // `graceDays * interval '1 day'` keeps the day count a normal bound
  // parameter (no raw string splicing needed for a trusted numeric constant).
  const graceInterval = TRUST_WEIGHTS.employer.ghosting.graceDays;
  const ghostingRows = await prisma.$queryRaw<EmployerGhostingRow[]>`
    SELECT j.company_id AS company_id,
           COUNT(*) FILTER (WHERE a.applied_at <= now() - (${graceInterval} * interval '1 day'))::int AS eligible,
           COUNT(*) FILTER (WHERE a.applied_at <= now() - (${graceInterval} * interval '1 day') AND a.status = 'APPLIED')::int AS ghosted
    FROM applications a
    JOIN jobs j ON j.id = a.job_id
    WHERE j.company_id = ANY(${foundIds})
    GROUP BY j.company_id
  `;
  const ghostingByCompanyId = new Map(ghostingRows.map((r) => [r.company_id, r]));

  // Admin job rejections in the trailing window — AdminAuditLog.targetId is a job id
  // (lib/admin/jobs.ts's reviewJob: targetType 'JOB', targetId = jobId), so this is
  // also a join, not a plain groupBy.
  const rejectionWindowDays = TRUST_WEIGHTS.employer.jobRejections.windowDays;
  const jobRejectionRows = await prisma.$queryRaw<EmployerJobRejectionRow[]>`
    SELECT j.company_id AS company_id, COUNT(*)::int AS rejections
    FROM admin_audit_logs aal
    JOIN jobs j ON j.id = aal.target_id
    WHERE aal.action = 'JOB_REJECT'
      AND aal.target_type = 'JOB'
      AND aal.created_at >= now() - (${rejectionWindowDays} * interval '1 day')
      AND j.company_id = ANY(${foundIds})
    GROUP BY j.company_id
  `;
  const jobRejectionsByCompanyId = new Map(jobRejectionRows.map((r) => [r.company_id, r.rejections]));

  const reviewRows = await prisma.review.groupBy({
    by: ["subjectCompanyId"],
    where: { subjectCompanyId: { in: foundIds }, status: { in: PUBLIC_REVIEW_STATUSES } },
    _avg: { rating: true },
    _count: { _all: true },
  });
  const reviewStatsById = new Map(
    reviewRows
      .filter((r): r is typeof r & { subjectCompanyId: string } => r.subjectCompanyId !== null)
      .map((r) => [r.subjectCompanyId, { average: r._avg.rating, count: r._count._all }])
  );

  const abuseRows = await prisma.abuseReport.groupBy({
    by: ["targetId"],
    where: { targetType: "COMPANY", targetId: { in: foundIds }, status: "ACTIONED" },
    _count: { _all: true },
  });
  const abuseCountByCompanyId = new Map(abuseRows.map((r) => [r.targetId, r._count._all]));

  const now = new Date();

  const results: EmployerTrustResult[] = companies.map((company) => {
    const ghosting = ghostingByCompanyId.get(company.id);
    const jobRejectionCount90d = jobRejectionsByCompanyId.get(company.id) ?? 0;
    const reviewStats = reviewStatsById.get(company.id) ?? { average: null, count: 0 };
    const upheldAbuseReportCount = abuseCountByCompanyId.get(company.id) ?? 0;

    const computation = computeEmployerTrustScore(
      {
        verifiedStatus: company.verifiedStatus,
        responseRate: company.responseRate,
        responseSampleSize: company.responseSampleSize,
        ghostingStats: {
          eligibleApplications: ghosting?.eligible ?? 0,
          ghostedApplications: ghosting?.ghosted ?? 0,
        },
        jobRejectionCount90d,
        reviewStats,
        upheldAbuseReportCount,
      },
      now
    );

    return { id: company.id, computation };
  });

  await writeTrustResults(results, (id, data) => prisma.company.update({ where: { id }, data }));

  return results;
}

/**
 * Shared write step for both sides: chunks `results` through
 * `ROLLUP_BATCH_SIZE` and writes each account's `trustScore` /
 * `trustScoreUpdatedAt` / `trustSignals` via `Promise.allSettled`, same
 * concurrency shape as `runResponseMetricsForAllCompanies` /
 * `runDailyRollupsForAllCompanies`. One failed write never blocks the rest
 * of the batch.
 */
async function writeTrustResults(
  results: Array<{ id: string; computation: TrustComputation }>,
  update: (id: string, data: { trustScore: number; trustScoreUpdatedAt: Date; trustSignals: Prisma.InputJsonValue }) => Promise<unknown>
): Promise<void> {
  for (let i = 0; i < results.length; i += ROLLUP_BATCH_SIZE) {
    await Promise.allSettled(
      results.slice(i, i + ROLLUP_BATCH_SIZE).map(async ({ id, computation }) => {
        try {
          await update(id, {
            trustScore: computation.score,
            trustScoreUpdatedAt: new Date(computation.computedAt),
            trustSignals: computation as unknown as Prisma.InputJsonValue,
          });
        } catch (error) {
          console.error(`[admin/trust] failed to write trust score for ${id}:`, error);
        }
      })
    );
  }
}

// ============================================================================
// Candidate selection + public entry points
// ============================================================================

/**
 * Distinct (userId, actorType) pairs from `PlatformEvent` since `since`,
 * split by side. One raw `SELECT DISTINCT` — Postgres dedupes at the
 * database, not by fetching every matching event row into the app first.
 * Bounded by the `createdAt` range, which is index-backed
 * (`platform_events_created_at_idx`).
 */
async function findActiveAccountUserIds(since: Date): Promise<{ seekerUserIds: string[]; employerUserIds: string[] }> {
  const rows = await prisma.$queryRaw<{ user_id: string; actor_type: string }[]>`
    SELECT DISTINCT user_id, actor_type
    FROM platform_events
    WHERE created_at >= ${since}
      AND actor_type IN ('SEEKER', 'EMPLOYER')
      AND user_id IS NOT NULL
  `;

  const seekerUserIds: string[] = [];
  const employerUserIds: string[] = [];
  for (const row of rows) {
    if (row.actor_type === "SEEKER") seekerUserIds.push(row.user_id);
    else if (row.actor_type === "EMPLOYER") employerUserIds.push(row.user_id);
  }
  return { seekerUserIds, employerUserIds };
}

export type RecomputeTrustScoresResult = { seekers: number; employers: number };

/**
 * Nightly cron entry point (docs/ADMIN-CONSOLE-PLAN.md §7.3): recomputes
 * trust scores for every seeker/employer account with `PlatformEvent`
 * activity since `since`. Candidate selection is two batched lookups
 * (distinct active userIds, then userId -> seekerProfileId/companyId), and
 * every downstream component read is batched per the file header's
 * PERFORMANCE note — nothing here loops a query per account.
 */
export async function recomputeTrustScores({ since }: { since: Date }): Promise<RecomputeTrustScoresResult> {
  const { seekerUserIds, employerUserIds } = await findActiveAccountUserIds(since);

  const [seekerProfileRows, companyRows] = await Promise.all([
    seekerUserIds.length
      ? prisma.seekerProfile.findMany({ where: { userId: { in: seekerUserIds } }, select: { id: true } })
      : Promise.resolve([] as { id: string }[]),
    employerUserIds.length
      ? prisma.company.findMany({ where: { userId: { in: employerUserIds } }, select: { id: true } })
      : Promise.resolve([] as { id: string }[]),
  ]);

  const [seekerResults, employerResults] = await Promise.all([
    recomputeSeekerTrustScoresBatch(seekerProfileRows.map((r) => r.id)),
    recomputeEmployerTrustScoresBatch(companyRows.map((r) => r.id)),
  ]);

  return { seekers: seekerResults.length, employers: employerResults.length };
}

/**
 * Single-account recompute — e.g. right after an admin decision that could
 * move a score (a company verification, a job rejection) without waiting
 * for the nightly sweep. Reuses the exact same batched fetchers with a
 * one-element id array, so the scoring logic never forks between the single
 * and bulk paths. Returns the new score, or `null` if the account doesn't
 * exist.
 */
export async function recomputeTrustScore(
  target: { type: "SEEKER"; seekerProfileId: string } | { type: "EMPLOYER"; companyId: string }
): Promise<number | null> {
  if (target.type === "SEEKER") {
    const [result] = await recomputeSeekerTrustScoresBatch([target.seekerProfileId]);
    return result?.computation.score ?? null;
  }
  const [result] = await recomputeEmployerTrustScoresBatch([target.companyId]);
  return result?.computation.score ?? null;
}
