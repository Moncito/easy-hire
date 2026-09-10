import type { Prisma, VerificationStatus, ReviewDirection, SalaryPeriod } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { AdminAuditAction } from "@/lib/admin/audit";

/**
 * SHARED RISK-RANKED QUEUE MODEL — docs/ADMIN-CONSOLE-PLAN.md §4.2, Phase 1.
 * ============================================================================
 * Generalises the four existing "pending only, FIFO, load everything" admin
 * queues (lib/admin/{companies,jobs,seekers}.ts + listDisputedReviews in
 * lib/reviews.ts) into one normalised `QueueItem` shape, risk-ranked instead
 * of FIFO, with cursor pagination and all-status filtering.
 *
 * This file is ADDITIVE. It does not replace or call the existing
 * `listPending*` functions — those keep serving the current admin pages
 * unchanged until the UI agent migrates them to `/admin/queues/*`.
 *
 * RANKING FORMULA (§4.2: "severity × age factor × reach", every weight in
 * one place, mirroring lib/admin/trust.ts's `TRUST_WEIGHTS`):
 *
 *   severity  = QUEUE_RANKING.rank.baselineSeverity + sum(matched severity signal contributions)
 *   ageFactor = 1 + ageHours * QUEUE_RANKING.rank.ageFactor.perHourGrowth
 *   reach     = kind-specific "how many users does this decision touch" (see
 *               each list*Queue function below), floored at
 *               QUEUE_RANKING.rank.reachFloor so a zero-reach item is never
 *               zeroed out of the ranking entirely
 *   rankScore = severity * ageFactor * reach
 *
 * SEVERITY SIGNALS IMPLEMENTED (batched across the fetched page — never
 * per-item queries):
 *   - disposable email domain on the account's email (all kinds)
 *   - free consumer webmail domain (COMPANY + JOB only — a registered
 *     business is expected to use a company domain; normal for seekers)
 *   - a PRIOR REJECTION for this exact target in `admin_audit_logs`
 *     (also sets `isAppeal: true`)
 *   - low `trustScore` (COMPANY/SEEKER: the subject's own score; JOB: the
 *     posting company's score; REVIEW: whichever side is the review's
 *     subject) — null is neutral (contributes 0), never treated as risk
 *   - JOB only: salary far outside the band for its category+period,
 *     computed from ACTIVE jobs, gated on a minimum comparable sample
 *     (mirrors `RESPONSE_METRICS_MIN_SAMPLE` in
 *     lib/employer/response-metrics.ts — never flag off a handful of jobs)
 *
 * SEVERITY SIGNALS NOT COMPUTABLE ON THE CURRENT SCHEMA (reported, not
 * faked — see the doc comments at each site below for exactly why):
 *   - seeker ID name mismatch (profile name vs. submitted document): no
 *     column anywhere stores a name extracted FROM the document — only
 *     `SeekerIdentityDocument.fileName`/`docType`. There is nothing to
 *     compare `SeekerProfile.fullName` against.
 *   - duplicate document hash (company verification docs or seeker ID
 *     docs): neither `VerificationDocument` nor `SeekerIdentityDocument`
 *     stores a content hash of any kind — only `fileUrl`/`fileName`.
 *
 * REACH DEFINITIONS (§4.2: "how many users the decision touches"):
 *   - COMPANY: the company's own jobs currently ACTIVE or PENDING_REVIEW —
 *     the population that is either already visible to seekers or would
 *     become visible/get closed the moment this verification is decided.
 *   - JOB: the SAME metric, but for the job's employer — the company's
 *     total ACTIVE/PENDING_REVIEW job count. A single job decision from a
 *     high-volume employer carries the same ripple as a company decision
 *     for that employer, so both kinds share one batched lookup.
 *   - SEEKER: the seeker's total application count — how many employers
 *     have already been exposed to this identity, and how many would be
 *     exposed to a bad one.
 *   - REVIEW: mirrors whichever side is the review's SUBJECT — the
 *     company's live job count if `subjectCompanyId` is set, the seeker's
 *     application count if `subjectSeekerId` is set. A disputed review
 *     about a 12-job employer colors more seekers' decisions than one
 *     about a company with none live yet.
 *
 * PAGINATION AND RANKING — the honest tradeoff (§10 "no loading a table
 * into memory to sort in JS" vs. "risk-ranked, not FIFO"):
 *   Every kind cursor-paginates at the database level on (updatedAt ASC,
 *   id ASC) — a real, always-populated, index-backed pair, `WHERE`-filtered
 *   past the cursor, never `OFFSET`. This is what keeps `listQueue` correct
 *   and fast as a queue grows to thousands of rows. Risk signals are then
 *   computed in batch ACROSS THAT ONE FETCHED PAGE ONLY, and the page is
 *   re-sorted by `rankScore` before being returned — so within any given
 *   page (and especially among older, SLA-relevant items, since the cursor
 *   itself walks oldest-first) the ordering is risk-first, not arrival-first.
 *   What this does NOT do is globally re-order the entire backlog by risk
 *   across page boundaries — a page-40 item cannot be shown to outrank a
 *   page-1 item without either sorting the whole table in the app (the
 *   thing §10 forbids) or maintaining a materialized/indexed rank column
 *   recomputed on a cadence, the same way `Company.trustScore` /
 *   `SeekerProfile.trustScore` are recomputed nightly by lib/admin/trust.ts.
 *   That materialization is the correct fix and is flagged here as the
 *   natural Phase 1 follow-up, not shipped in this pass.
 *
 * PERFORMANCE: every severity/reach signal below is one batched query
 * (`groupBy`/aggregate/raw `ANY($ids)`) keyed across the ids on the fetched
 * page — never a query per item. See each `batch*` helper.
 */

// ============================================================================
// Constants — single source of truth for every weight/threshold, exactly the
// structure lib/admin/trust.ts uses for TRUST_WEIGHTS.
// ============================================================================

export const QUEUE_RANKING_VERSION = 1;

export const QUEUE_RANKING = {
  /** SLA banding off `ageHours` (§4.2): GREEN under 12h, AMBER 12–24h, RED 24h+. */
  sla: {
    greenUnderHours: 12,
    amberUnderHours: 24,
  },

  rank: {
    /** Every item starts here so `rankScore` is never zero and a zero-signal item is still orderable by age/reach alone. */
    baselineSeverity: 1,
    /** ageFactor = 1 + ageHours * perHourGrowth. 1/24 means +1.0 of factor per full day aged — a 24h-old item ranks ~2x a fresh one at equal severity/reach, a 72h-old item ~4x. */
    ageFactor: { perHourGrowth: 1 / 24 },
    /** `reach` is floored here before multiplying — a decision that (per its kind's definition) touches zero other accounts must still be rankable by severity/age, not silently zeroed out. */
    reachFloor: 1,
  },

  severity: {
    /** All kinds. See DISPOSABLE_EMAIL_DOMAINS below. */
    disposableEmailDomain: 3,
    /** COMPANY + JOB only. See FREE_MAIL_DOMAINS below. */
    freeMailDomainForBusiness: 1,
    /** All kinds. A prior REJECT decision recorded in `admin_audit_logs` against this exact target. Also sets `isAppeal: true` on the item. */
    priorRejection: 4,
    /** All kinds. `trustScore < threshold` contributes `weight`; `trustScore === null` contributes 0 (neutral, per lib/admin/trust.ts's own Rule 1 — a missing signal is never a penalty). */
    lowTrustScore: { threshold: 40, weight: 2 },
    /** JOB only. Gated on a minimum sample of comparable ACTIVE jobs in the same (category, salaryPeriod) — same minimum-sample precedent as RESPONSE_METRICS_MIN_SAMPLE in lib/employer/response-metrics.ts. Flags a job whose salary midpoint is more than `stdDevMultiplier` population-stddevs from the category+period mean. */
    salaryOutlier: { minCategorySample: 5, stdDevMultiplier: 2, weight: 3 },
  },

  /** Job/company statuses counted as "live" for the reach definitions above. */
  reach: {
    companyLiveJobStatuses: ["ACTIVE", "PENDING_REVIEW"] as const,
  },
} as const;

/**
 * Small built-in list of disposable/temp-mail domains — no dependency added,
 * per the task's constraint. Not exhaustive; covers the common providers
 * seen in signup-abuse writeups. Extending this list is a one-line change,
 * same rationale as the reason-code vocabularies.
 */
const DISPOSABLE_EMAIL_DOMAINS: ReadonlySet<string> = new Set([
  "mailinator.com",
  "guerrillamail.com",
  "guerrillamail.info",
  "guerrillamail.biz",
  "10minutemail.com",
  "10minutemail.net",
  "tempmail.com",
  "temp-mail.org",
  "yopmail.com",
  "trashmail.com",
  "getnada.com",
  "dispostable.com",
  "fakeinbox.com",
  "sharklasers.com",
  "mailnesia.com",
  "throwawaymail.com",
  "maildrop.cc",
  "mintemail.com",
  "moakt.com",
  "tempinbox.com",
  "emailondeck.com",
  "spamgourmet.com",
  "mytemp.email",
  "inboxbear.com",
  "discard.email",
  "mailcatch.com",
  "burnermail.io",
]);

/**
 * Free consumer webmail — NOT a fraud signal on its own (normal and
 * expected for seekers), so this is only applied to COMPANY/JOB severity
 * below, where a legitimately registered business is expected to use a
 * company-owned domain.
 */
const FREE_MAIL_DOMAINS: ReadonlySet<string> = new Set([
  "gmail.com",
  "yahoo.com",
  "hotmail.com",
  "outlook.com",
  "aol.com",
  "icloud.com",
  "protonmail.com",
  "proton.me",
  "mail.com",
  "gmx.com",
  "yandex.com",
  "live.com",
  "msn.com",
  "zoho.com",
]);

function emailDomain(email: string): string {
  const parts = email.toLowerCase().trim().split("@");
  return parts[1] ?? "";
}

// ============================================================================
// Shared shapes
// ============================================================================

export type QueueKind = "COMPANY" | "SEEKER" | "JOB" | "REVIEW";

export type QueueStatus = "PENDING" | "APPROVED" | "REJECTED";

export type SlaBand = "GREEN" | "AMBER" | "RED";

/** One matched severity signal — mirrors `TrustComponent` in lib/admin/trust.ts so a queue item's score is explainable the same way a trust score is. */
export type QueueSeveritySignal = {
  key: string;
  contribution: number;
  detail?: Record<string, string | number | boolean | null>;
};

export type CompanyQueuePayload = {
  companyId: string;
  companyName: string;
  industry: string | null;
  verifiedStatus: VerificationStatus;
  email: string;
  trustScore: number | null;
  liveJobCount: number;
};

export type SeekerQueuePayload = {
  seekerProfileId: string;
  fullName: string;
  email: string;
  idVerificationStatus: VerificationStatus;
  trustScore: number | null;
  applicationCount: number;
};

export type JobQueuePayload = {
  jobId: string;
  companyId: string;
  companyName: string;
  title: string;
  category: string;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryPeriod: SalaryPeriod;
  status: string;
};

export type ReviewQueuePayload = {
  reviewId: string;
  direction: ReviewDirection;
  rating: number;
  disputeReason: string | null;
  subjectCompanyId: string | null;
  subjectSeekerId: string | null;
  subjectName: string;
  status: string;
};

export type QueueItem = {
  id: string;
  kind: QueueKind;
  title: string;
  subtitle: string;
  submittedAt: Date;
  ageHours: number;
  slaBand: SlaBand;
  severity: number;
  severitySignals: QueueSeveritySignal[];
  reach: number;
  rankScore: number;
  isAppeal: boolean;
  status: QueueStatus;
  payload: CompanyQueuePayload | SeekerQueuePayload | JobQueuePayload | ReviewQueuePayload;
};

/** Cursor is always (updatedAt, id) — see the module doc comment's PAGINATION section for why every kind shares this one pair. */
export type QueueCursor = { updatedAt: Date; id: string };

export function encodeQueueCursor(cursor: QueueCursor): string {
  return Buffer.from(JSON.stringify({ updatedAt: cursor.updatedAt.toISOString(), id: cursor.id }), "utf8").toString(
    "base64url"
  );
}

export function decodeQueueCursor(raw: string): QueueCursor | null {
  try {
    const parsed = JSON.parse(Buffer.from(raw, "base64url").toString("utf8"));
    if (typeof parsed?.updatedAt !== "string" || typeof parsed?.id !== "string") return null;
    const updatedAt = new Date(parsed.updatedAt);
    if (Number.isNaN(updatedAt.getTime())) return null;
    return { updatedAt, id: parsed.id };
  } catch {
    return null;
  }
}

// ============================================================================
// Pure ranking functions — no Prisma in the signature/body, unit-testable in
// isolation, same precedent as computeSeekerTrustScore/computeResponseMetrics.
// ============================================================================

export function computeAgeHours(submittedAt: Date, now: Date): number {
  return Math.max(0, (now.getTime() - submittedAt.getTime()) / (1000 * 60 * 60));
}

export function computeSlaBand(ageHours: number): SlaBand {
  if (ageHours < QUEUE_RANKING.sla.greenUnderHours) return "GREEN";
  if (ageHours < QUEUE_RANKING.sla.amberUnderHours) return "AMBER";
  return "RED";
}

function computeAgeFactor(ageHours: number): number {
  return 1 + ageHours * QUEUE_RANKING.rank.ageFactor.perHourGrowth;
}

export function computeRankScore(severity: number, ageHours: number, reach: number): number {
  const boundedReach = Math.max(QUEUE_RANKING.rank.reachFloor, reach);
  return severity * computeAgeFactor(ageHours) * boundedReach;
}

function buildSeverity(signals: QueueSeveritySignal[]): number {
  return QUEUE_RANKING.rank.baselineSeverity + signals.reduce((sum, s) => sum + s.contribution, 0);
}

function salaryMidpoint(min: number | null, max: number | null): number | null {
  if (min !== null && max !== null) return (min + max) / 2;
  return min ?? max ?? null;
}

// ============================================================================
// Generic pagination helper — shared by all four kinds.
// ============================================================================

function paginate<T extends { updatedAt: Date; id: string }>(
  rows: T[],
  limit: number
): { page: T[]; nextCursor: QueueCursor | null } {
  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const last = page[page.length - 1];
  return { page, nextCursor: hasMore && last ? { updatedAt: last.updatedAt, id: last.id } : null };
}

// ============================================================================
// Batched signal lookups — ONE query across all ids on the fetched page,
// never a query per item. Shared across kinds where the underlying data is
// the same shape.
// ============================================================================

/** Prior-decision count per target id, for exactly one (targetType, action) pair. Powers both the `priorRejection` severity signal and `isAppeal`. */
async function batchPriorDecisionCounts(
  targetType: string,
  action: AdminAuditAction,
  targetIds: string[]
): Promise<Map<string, number>> {
  if (targetIds.length === 0) return new Map();
  const rows = await prisma.adminAuditLog.groupBy({
    by: ["targetId"],
    where: { targetType, targetId: { in: targetIds }, action },
    _count: { _all: true },
  });
  return new Map(rows.map((r) => [r.targetId, r._count._all]));
}

/** Reach input for COMPANY and JOB kinds: count of ACTIVE/PENDING_REVIEW jobs per company id. */
async function batchCompanyLiveJobCounts(companyIds: string[]): Promise<Map<string, number>> {
  if (companyIds.length === 0) return new Map();
  const rows = await prisma.job.groupBy({
    by: ["companyId"],
    where: { companyId: { in: companyIds }, status: { in: [...QUEUE_RANKING.reach.companyLiveJobStatuses] } },
    _count: { _all: true },
  });
  return new Map(rows.map((r) => [r.companyId, r._count._all]));
}

/** Reach input for SEEKER (and one side of REVIEW): total application count per seeker profile id. */
async function batchSeekerApplicationCounts(seekerProfileIds: string[]): Promise<Map<string, number>> {
  if (seekerProfileIds.length === 0) return new Map();
  const rows = await prisma.application.groupBy({
    by: ["seekerId"],
    where: { seekerId: { in: seekerProfileIds } },
    _count: { _all: true },
  });
  return new Map(rows.map((r) => [r.seekerId, r._count._all]));
}

/**
 * Email per admin user id, for `getDecisionStats`'s `byAdmin` table. `User`
 * carries no display-name column (see `model User` in schema.prisma — just
 * `email`), so email is the only identifying detail available. An id with
 * no matching row (admin account deleted; `admin_audit_logs` is NOT
 * cascade-deleted, see its own schema comment) is simply absent from the
 * returned map — callers fall back to `null`, never a thrown error.
 */
async function batchAdminEmails(adminUserIds: string[]): Promise<Map<string, string>> {
  if (adminUserIds.length === 0) return new Map();
  const rows = await prisma.user.findMany({
    where: { id: { in: adminUserIds } },
    select: { id: true, email: true },
  });
  return new Map(rows.map((r) => [r.id, r.email]));
}

type CategorySalaryStatsRow = {
  category: string;
  salary_period: SalaryPeriod;
  avg_salary: number;
  stddev_salary: number | null;
  sample: number;
};

/**
 * Category+period salary band, batched across every (category, salaryPeriod)
 * pair present on the fetched page of jobs in one query — never per job.
 * Uses raw SQL (same precedent as lib/admin/trust.ts's application-stats
 * query) because Prisma's `groupBy` has no STDDEV aggregate and can't
 * express the per-row `COALESCE(midpoint)` this needs. Gated on
 * `minCategorySample` — pairs with fewer comparable ACTIVE jobs are simply
 * absent from the returned map, never flagged off a thin sample.
 */
async function batchCategorySalaryStats(
  categories: string[]
): Promise<Map<string, { avg: number; stddev: number; sample: number }>> {
  if (categories.length === 0) return new Map();

  const rows = await prisma.$queryRaw<CategorySalaryStatsRow[]>`
    SELECT category,
           salary_period,
           AVG(midpoint)::float AS avg_salary,
           STDDEV_POP(midpoint)::float AS stddev_salary,
           COUNT(*)::int AS sample
    FROM (
      SELECT category,
             salary_period,
             COALESCE((salary_min + salary_max) / 2.0, salary_min, salary_max) AS midpoint
      FROM jobs
      WHERE status = 'ACTIVE'
        AND category = ANY(${categories})
        AND (salary_min IS NOT NULL OR salary_max IS NOT NULL)
    ) sub
    GROUP BY category, salary_period
  `;

  const gate = QUEUE_RANKING.severity.salaryOutlier.minCategorySample;
  const map = new Map<string, { avg: number; stddev: number; sample: number }>();
  for (const row of rows) {
    if (row.sample < gate) continue;
    map.set(`${row.category}::${row.salary_period}`, {
      avg: row.avg_salary,
      stddev: row.stddev_salary ?? 0,
      sample: row.sample,
    });
  }
  return map;
}

function isSalaryOutlier(
  midpoint: number | null,
  stats: { avg: number; stddev: number } | undefined
): boolean {
  if (midpoint === null || !stats) return false;
  const { stdDevMultiplier } = QUEUE_RANKING.severity.salaryOutlier;
  if (stats.stddev > 0) return Math.abs(midpoint - stats.avg) > stdDevMultiplier * stats.stddev;
  // Zero variance in the comparison set (every comparable job pays exactly
  // the mean) — any deviation at all is then the whole signal.
  return midpoint !== stats.avg;
}

// ============================================================================
// Query params shared by every list*Queue function.
// ============================================================================

export type QueueListParams = {
  kind: QueueKind;
  status?: QueueStatus;
  search?: string;
  cursor?: QueueCursor;
  limit: number;
};

export type QueueListResult = { items: QueueItem[]; nextCursor: QueueCursor | null };

export const DEFAULT_QUEUE_LIST_LIMIT = 25;
export const MAX_QUEUE_LIST_LIMIT = 100;

// ============================================================================
// COMPANY
// ============================================================================

async function listCompanyQueue(params: QueueListParams): Promise<QueueListResult> {
  const { status, search, cursor, limit } = params;

  const where: Prisma.CompanyWhereInput = {
    ...(status ? { verifiedStatus: status } : {}),
    ...(search
      ? {
          OR: [
            { companyName: { contains: search, mode: "insensitive" } },
            { industry: { contains: search, mode: "insensitive" } },
            { user: { email: { contains: search, mode: "insensitive" } } },
          ],
        }
      : {}),
    ...(cursor
      ? {
          OR: [
            { updatedAt: { gt: cursor.updatedAt } },
            { updatedAt: cursor.updatedAt, id: { gt: cursor.id } },
          ],
        }
      : {}),
  };

  const rows = await prisma.company.findMany({
    where,
    orderBy: [{ updatedAt: "asc" }, { id: "asc" }],
    take: limit + 1,
    select: {
      id: true,
      companyName: true,
      industry: true,
      verifiedStatus: true,
      updatedAt: true,
      trustScore: true,
      user: { select: { email: true } },
    },
  });

  const { page, nextCursor } = paginate(rows, limit);
  const companyIds = page.map((r) => r.id);

  const [priorRejections, liveJobCounts] = await Promise.all([
    batchPriorDecisionCounts("COMPANY", "COMPANY_REJECT", companyIds),
    batchCompanyLiveJobCounts(companyIds),
  ]);

  const now = new Date();
  const items: QueueItem[] = page.map((row) => {
    const ageHours = computeAgeHours(row.updatedAt, now);
    const reach = liveJobCounts.get(row.id) ?? 0;
    const priorRejectionCount = priorRejections.get(row.id) ?? 0;
    const domain = emailDomain(row.user.email);

    const signals: QueueSeveritySignal[] = [];
    if (DISPOSABLE_EMAIL_DOMAINS.has(domain)) {
      signals.push({ key: "disposableEmailDomain", contribution: QUEUE_RANKING.severity.disposableEmailDomain, detail: { domain } });
    }
    if (FREE_MAIL_DOMAINS.has(domain)) {
      signals.push({ key: "freeMailDomainForBusiness", contribution: QUEUE_RANKING.severity.freeMailDomainForBusiness, detail: { domain } });
    }
    if (priorRejectionCount > 0) {
      signals.push({ key: "priorRejection", contribution: QUEUE_RANKING.severity.priorRejection, detail: { priorRejectionCount } });
    }
    if (row.trustScore !== null && row.trustScore < QUEUE_RANKING.severity.lowTrustScore.threshold) {
      signals.push({ key: "lowTrustScore", contribution: QUEUE_RANKING.severity.lowTrustScore.weight, detail: { trustScore: row.trustScore } });
    }

    const severity = buildSeverity(signals);

    return {
      id: row.id,
      kind: "COMPANY",
      title: row.companyName,
      subtitle: row.industry ?? "Company verification",
      submittedAt: row.updatedAt,
      ageHours,
      slaBand: computeSlaBand(ageHours),
      severity,
      severitySignals: signals,
      reach,
      rankScore: computeRankScore(severity, ageHours, reach),
      isAppeal: priorRejectionCount > 0,
      status: row.verifiedStatus as QueueStatus,
      payload: {
        companyId: row.id,
        companyName: row.companyName,
        industry: row.industry,
        verifiedStatus: row.verifiedStatus,
        email: row.user.email,
        trustScore: row.trustScore,
        liveJobCount: reach,
      } satisfies CompanyQueuePayload,
    };
  });

  items.sort((a, b) => b.rankScore - a.rankScore);
  return { items, nextCursor };
}

// ============================================================================
// SEEKER
// ============================================================================

async function listSeekerQueue(params: QueueListParams): Promise<QueueListResult> {
  const { status, search, cursor, limit } = params;

  const where: Prisma.SeekerProfileWhereInput = {
    idVerificationStatus: status ?? { not: null },
    ...(search
      ? {
          OR: [
            { fullName: { contains: search, mode: "insensitive" } },
            { user: { email: { contains: search, mode: "insensitive" } } },
          ],
        }
      : {}),
    ...(cursor
      ? {
          OR: [
            { updatedAt: { gt: cursor.updatedAt } },
            { updatedAt: cursor.updatedAt, id: { gt: cursor.id } },
          ],
        }
      : {}),
  };

  const rows = await prisma.seekerProfile.findMany({
    where,
    orderBy: [{ updatedAt: "asc" }, { id: "asc" }],
    take: limit + 1,
    select: {
      id: true,
      fullName: true,
      idVerificationStatus: true,
      updatedAt: true,
      trustScore: true,
      user: { select: { email: true } },
    },
  });

  const { page, nextCursor } = paginate(rows, limit);
  const seekerIds = page.map((r) => r.id);

  const [priorRejections, applicationCounts] = await Promise.all([
    batchPriorDecisionCounts("SEEKER_PROFILE", "SEEKER_VERIFICATION_REJECT", seekerIds),
    batchSeekerApplicationCounts(seekerIds),
  ]);

  const now = new Date();
  const items: QueueItem[] = page.map((row) => {
    const ageHours = computeAgeHours(row.updatedAt, now);
    const reach = applicationCounts.get(row.id) ?? 0;
    const priorRejectionCount = priorRejections.get(row.id) ?? 0;
    const domain = emailDomain(row.user.email);

    // NOTE: no freeMailDomainForBusiness signal here on purpose — a seeker
    // using gmail/yahoo/etc. is normal, not a risk signal (see the module
    // doc comment and FREE_MAIL_DOMAINS' own comment).
    const signals: QueueSeveritySignal[] = [];
    if (DISPOSABLE_EMAIL_DOMAINS.has(domain)) {
      signals.push({ key: "disposableEmailDomain", contribution: QUEUE_RANKING.severity.disposableEmailDomain, detail: { domain } });
    }
    if (priorRejectionCount > 0) {
      signals.push({ key: "priorRejection", contribution: QUEUE_RANKING.severity.priorRejection, detail: { priorRejectionCount } });
    }
    if (row.trustScore !== null && row.trustScore < QUEUE_RANKING.severity.lowTrustScore.threshold) {
      signals.push({ key: "lowTrustScore", contribution: QUEUE_RANKING.severity.lowTrustScore.weight, detail: { trustScore: row.trustScore } });
    }
    // NOT COMPUTABLE, not implemented (see module doc comment):
    //  - name mismatch between profile name and submitted document — no
    //    document-extracted name field exists on SeekerIdentityDocument.
    //  - duplicate document hash — no hash column exists on
    //    SeekerIdentityDocument.

    const severity = buildSeverity(signals);
    // idVerificationStatus is guaranteed non-null by the WHERE clause above.
    const idStatus = row.idVerificationStatus as VerificationStatus;

    return {
      id: row.id,
      kind: "SEEKER",
      title: row.fullName,
      subtitle: "Identity verification",
      submittedAt: row.updatedAt,
      ageHours,
      slaBand: computeSlaBand(ageHours),
      severity,
      severitySignals: signals,
      reach,
      rankScore: computeRankScore(severity, ageHours, reach),
      isAppeal: priorRejectionCount > 0,
      status: idStatus as QueueStatus,
      payload: {
        seekerProfileId: row.id,
        fullName: row.fullName,
        email: row.user.email,
        idVerificationStatus: idStatus,
        trustScore: row.trustScore,
        applicationCount: reach,
      } satisfies SeekerQueuePayload,
    };
  });

  items.sort((a, b) => b.rankScore - a.rankScore);
  return { items, nextCursor };
}

// ============================================================================
// JOB
// ============================================================================

/** The superset of job rows this queue ever shows — see the module doc comment's status-mapping note. `DRAFT` only qualifies when it carries a rejection reason (i.e. it was rejected by review, not just never submitted). */
const JOB_QUEUE_ALL_STATUSES: Prisma.JobWhereInput = {
  OR: [{ status: "PENDING_REVIEW" }, { status: "ACTIVE" }, { status: "DRAFT", reviewRejectionReason: { not: null } }],
};

function jobQueueStatusWhere(status: QueueStatus | undefined): Prisma.JobWhereInput {
  if (status === "PENDING") return { status: "PENDING_REVIEW" };
  if (status === "APPROVED") return { status: "ACTIVE" };
  if (status === "REJECTED") return { status: "DRAFT", reviewRejectionReason: { not: null } };
  return JOB_QUEUE_ALL_STATUSES;
}

function jobQueueStatus(status: string, reviewRejectionReason: string | null): QueueStatus {
  if (status === "ACTIVE") return "APPROVED";
  if (status === "DRAFT" && reviewRejectionReason) return "REJECTED";
  return "PENDING";
}

async function listJobQueue(params: QueueListParams): Promise<QueueListResult> {
  const { status, search, cursor, limit } = params;

  const where: Prisma.JobWhereInput = {
    ...jobQueueStatusWhere(status),
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { category: { contains: search, mode: "insensitive" } },
            { company: { companyName: { contains: search, mode: "insensitive" } } },
          ],
        }
      : {}),
    ...(cursor
      ? {
          OR: [
            { updatedAt: { gt: cursor.updatedAt } },
            { updatedAt: cursor.updatedAt, id: { gt: cursor.id } },
          ],
        }
      : {}),
  };

  const rows = await prisma.job.findMany({
    where,
    orderBy: [{ updatedAt: "asc" }, { id: "asc" }],
    take: limit + 1,
    select: {
      id: true,
      title: true,
      category: true,
      status: true,
      salaryMin: true,
      salaryMax: true,
      salaryPeriod: true,
      updatedAt: true,
      pendingReviewAt: true,
      reviewRejectionReason: true,
      companyId: true,
      company: {
        select: { id: true, companyName: true, trustScore: true, user: { select: { email: true } } },
      },
    },
  });

  const { page, nextCursor } = paginate(rows, limit);
  const jobIds = page.map((r) => r.id);
  const companyIds = Array.from(new Set(page.map((r) => r.companyId)));
  const categories = Array.from(new Set(page.map((r) => r.category)));

  const [priorRejections, liveJobCounts, salaryStats] = await Promise.all([
    batchPriorDecisionCounts("JOB", "JOB_REJECT", jobIds),
    batchCompanyLiveJobCounts(companyIds),
    batchCategorySalaryStats(categories),
  ]);

  const now = new Date();
  const items: QueueItem[] = page.map((row) => {
    // Display age prefers the precise "entered review" stamp when present;
    // the cursor/sort key above always uses `updatedAt` (see module doc
    // comment's PAGINATION section for why — pendingReviewAt is nullable on
    // historical jobs and can't safely anchor a cursor).
    const submittedAt = row.pendingReviewAt ?? row.updatedAt;
    const ageHours = computeAgeHours(submittedAt, now);
    const reach = liveJobCounts.get(row.companyId) ?? 0;
    const priorRejectionCount = priorRejections.get(row.id) ?? 0;
    const domain = emailDomain(row.company.user.email);
    const midpoint = salaryMidpoint(row.salaryMin, row.salaryMax);
    const statsKey = `${row.category}::${row.salaryPeriod}`;
    const outlier = isSalaryOutlier(midpoint, salaryStats.get(statsKey));

    const signals: QueueSeveritySignal[] = [];
    if (DISPOSABLE_EMAIL_DOMAINS.has(domain)) {
      signals.push({ key: "disposableEmailDomain", contribution: QUEUE_RANKING.severity.disposableEmailDomain, detail: { domain } });
    }
    if (FREE_MAIL_DOMAINS.has(domain)) {
      signals.push({ key: "freeMailDomainForBusiness", contribution: QUEUE_RANKING.severity.freeMailDomainForBusiness, detail: { domain } });
    }
    if (priorRejectionCount > 0) {
      signals.push({ key: "priorRejection", contribution: QUEUE_RANKING.severity.priorRejection, detail: { priorRejectionCount } });
    }
    if (row.company.trustScore !== null && row.company.trustScore < QUEUE_RANKING.severity.lowTrustScore.threshold) {
      signals.push({
        key: "lowTrustScore",
        contribution: QUEUE_RANKING.severity.lowTrustScore.weight,
        detail: { trustScore: row.company.trustScore },
      });
    }
    if (outlier) {
      const stats = salaryStats.get(statsKey);
      signals.push({
        key: "salaryOutlier",
        contribution: QUEUE_RANKING.severity.salaryOutlier.weight,
        detail: { midpoint, categoryAverage: stats?.avg ?? null, category: row.category, salaryPeriod: row.salaryPeriod },
      });
    }

    const severity = buildSeverity(signals);
    const mappedStatus = jobQueueStatus(row.status, row.reviewRejectionReason);

    return {
      id: row.id,
      kind: "JOB",
      title: row.title,
      subtitle: `${row.company.companyName} • ${row.category}`,
      submittedAt,
      ageHours,
      slaBand: computeSlaBand(ageHours),
      severity,
      severitySignals: signals,
      reach,
      rankScore: computeRankScore(severity, ageHours, reach),
      isAppeal: priorRejectionCount > 0,
      status: mappedStatus,
      payload: {
        jobId: row.id,
        companyId: row.companyId,
        companyName: row.company.companyName,
        title: row.title,
        category: row.category,
        salaryMin: row.salaryMin,
        salaryMax: row.salaryMax,
        salaryPeriod: row.salaryPeriod,
        status: row.status,
      } satisfies JobQueuePayload,
    };
  });

  items.sort((a, b) => b.rankScore - a.rankScore);
  return { items, nextCursor };
}

// ============================================================================
// REVIEW
// ============================================================================

const REVIEW_QUEUE_ALL_STATUSES: Prisma.ReviewWhereInput = {
  OR: [{ status: "DISPUTED" }, { status: "PUBLISHED", resolvedByUserId: { not: null } }, { status: "HIDDEN" }],
};

function reviewQueueStatusWhere(status: QueueStatus | undefined): Prisma.ReviewWhereInput {
  if (status === "PENDING") return { status: "DISPUTED" };
  if (status === "APPROVED") return { status: "PUBLISHED", resolvedByUserId: { not: null } };
  if (status === "REJECTED") return { status: "HIDDEN" };
  return REVIEW_QUEUE_ALL_STATUSES;
}

function reviewQueueStatus(status: string): QueueStatus {
  if (status === "HIDDEN") return "REJECTED";
  if (status === "PUBLISHED") return "APPROVED";
  return "PENDING";
}

async function listReviewQueue(params: QueueListParams): Promise<QueueListResult> {
  const { status, search, cursor, limit } = params;

  const where: Prisma.ReviewWhereInput = {
    ...reviewQueueStatusWhere(status),
    ...(search
      ? {
          OR: [
            { body: { contains: search, mode: "insensitive" } },
            { disputeReason: { contains: search, mode: "insensitive" } },
            { application: { job: { title: { contains: search, mode: "insensitive" } } } },
            { application: { job: { company: { companyName: { contains: search, mode: "insensitive" } } } } },
            { application: { seeker: { fullName: { contains: search, mode: "insensitive" } } } },
          ],
        }
      : {}),
    ...(cursor
      ? {
          OR: [
            { updatedAt: { gt: cursor.updatedAt } },
            { updatedAt: cursor.updatedAt, id: { gt: cursor.id } },
          ],
        }
      : {}),
  };

  const rows = await prisma.review.findMany({
    where,
    orderBy: [{ updatedAt: "asc" }, { id: "asc" }],
    take: limit + 1,
    select: {
      id: true,
      direction: true,
      rating: true,
      disputeReason: true,
      disputedAt: true,
      status: true,
      updatedAt: true,
      subjectCompanyId: true,
      subjectSeekerId: true,
      author: { select: { email: true } },
      application: {
        select: {
          job: {
            select: { title: true, company: { select: { id: true, companyName: true, trustScore: true } } },
          },
          seeker: { select: { id: true, fullName: true, trustScore: true } },
        },
      },
    },
  });

  const { page, nextCursor } = paginate(rows, limit);
  const reviewIds = page.map((r) => r.id);
  const companyIds = page.map((r) => r.subjectCompanyId).filter((id): id is string => id !== null);
  const seekerIds = page.map((r) => r.subjectSeekerId).filter((id): id is string => id !== null);

  const [priorHides, liveJobCounts, applicationCounts] = await Promise.all([
    batchPriorDecisionCounts("REVIEW", "REVIEW_HIDE", reviewIds),
    batchCompanyLiveJobCounts(companyIds),
    batchSeekerApplicationCounts(seekerIds),
  ]);

  const now = new Date();
  const items: QueueItem[] = page.map((row) => {
    const submittedAt = row.disputedAt ?? row.updatedAt;
    const ageHours = computeAgeHours(submittedAt, now);

    // Reach mirrors whichever side is the review's SUBJECT (see module doc
    // comment's REACH DEFINITIONS section) — not the author.
    const reach = row.subjectCompanyId
      ? liveJobCounts.get(row.subjectCompanyId) ?? 0
      : row.subjectSeekerId
        ? applicationCounts.get(row.subjectSeekerId) ?? 0
        : 0;

    const priorHideCount = priorHides.get(row.id) ?? 0;
    // Severity email check runs against the review's AUTHOR (not the
    // subject) — the fraud question here is "was this review itself
    // planted/manipulated by a low-cost account", which is about who wrote
    // it, not who it's about.
    const domain = emailDomain(row.author.email);
    // Trust-score check, by contrast, runs against the SUBJECT — the
    // question there is "is the account disputing this review itself
    // low-trust", same reasoning as the reach definition above.
    const subjectTrustScore = row.subjectCompanyId
      ? row.application.job.company.trustScore
      : row.subjectSeekerId
        ? row.application.seeker.trustScore
        : null;

    const signals: QueueSeveritySignal[] = [];
    if (DISPOSABLE_EMAIL_DOMAINS.has(domain)) {
      signals.push({ key: "disposableEmailDomain", contribution: QUEUE_RANKING.severity.disposableEmailDomain, detail: { domain } });
    }
    if (priorHideCount > 0) {
      signals.push({ key: "priorRejection", contribution: QUEUE_RANKING.severity.priorRejection, detail: { priorHideCount } });
    }
    if (subjectTrustScore !== null && subjectTrustScore < QUEUE_RANKING.severity.lowTrustScore.threshold) {
      signals.push({ key: "lowTrustScore", contribution: QUEUE_RANKING.severity.lowTrustScore.weight, detail: { trustScore: subjectTrustScore } });
    }

    const severity = buildSeverity(signals);
    const subjectName = row.subjectCompanyId
      ? row.application.job.company.companyName
      : row.application.seeker.fullName;

    return {
      id: row.id,
      kind: "REVIEW",
      title: `Review dispute (${row.rating}★)`,
      subtitle:
        row.direction === "SEEKER_TO_COMPANY"
          ? `${subjectName} — reviewed by a seeker on "${row.application.job.title}"`
          : `${subjectName} — reviewed by ${row.application.job.company.companyName}`,
      submittedAt,
      ageHours,
      slaBand: computeSlaBand(ageHours),
      severity,
      severitySignals: signals,
      reach,
      rankScore: computeRankScore(severity, ageHours, reach),
      isAppeal: priorHideCount > 0,
      status: reviewQueueStatus(row.status),
      payload: {
        reviewId: row.id,
        direction: row.direction,
        rating: row.rating,
        disputeReason: row.disputeReason,
        subjectCompanyId: row.subjectCompanyId,
        subjectSeekerId: row.subjectSeekerId,
        subjectName,
        status: row.status,
      } satisfies ReviewQueuePayload,
    };
  });

  items.sort((a, b) => b.rankScore - a.rankScore);
  return { items, nextCursor };
}

// ============================================================================
// Public entry point — dispatches to the kind-specific fetcher above.
// ============================================================================

export async function listQueue(input: {
  kind: QueueKind;
  status?: QueueStatus;
  search?: string;
  cursor?: QueueCursor;
  limit?: number;
}): Promise<QueueListResult> {
  const limit = Math.min(Math.max(input.limit ?? DEFAULT_QUEUE_LIST_LIMIT, 1), MAX_QUEUE_LIST_LIMIT);
  const params: QueueListParams = { kind: input.kind, status: input.status, search: input.search, cursor: input.cursor, limit };

  switch (input.kind) {
    case "COMPANY":
      return listCompanyQueue(params);
    case "SEEKER":
      return listSeekerQueue(params);
    case "JOB":
      return listJobQueue(params);
    case "REVIEW":
      return listReviewQueue(params);
  }
}

// ============================================================================
// getQueueHealth — depth, oldest-item age, SLA breach count, per queue.
// 8 total aggregate queries (2 per kind: one for depth+oldest, one for the
// breach count) — bounded and constant regardless of table size, never a
// scan of the full pending set into the app.
// ============================================================================

export type QueueHealth = {
  kind: QueueKind;
  depth: number;
  oldestAgeHours: number | null;
  slaBreaches: number;
};

export async function getQueueHealth(): Promise<QueueHealth[]> {
  const now = new Date();
  const redCutoff = new Date(now.getTime() - QUEUE_RANKING.sla.amberUnderHours * 60 * 60 * 1000);

  const [companyAgg, seekerAgg, jobAgg, reviewAgg] = await Promise.all([
    prisma.company.aggregate({ where: { verifiedStatus: "PENDING" }, _count: { _all: true }, _min: { updatedAt: true } }),
    prisma.seekerProfile.aggregate({
      where: { idVerificationStatus: "PENDING" },
      _count: { _all: true },
      _min: { updatedAt: true },
    }),
    prisma.job.aggregate({ where: { status: "PENDING_REVIEW" }, _count: { _all: true }, _min: { updatedAt: true } }),
    prisma.review.aggregate({ where: { status: "DISPUTED" }, _count: { _all: true }, _min: { updatedAt: true } }),
  ]);

  const [companyBreaches, seekerBreaches, jobBreaches, reviewBreaches] = await Promise.all([
    prisma.company.count({ where: { verifiedStatus: "PENDING", updatedAt: { lte: redCutoff } } }),
    prisma.seekerProfile.count({ where: { idVerificationStatus: "PENDING", updatedAt: { lte: redCutoff } } }),
    prisma.job.count({ where: { status: "PENDING_REVIEW", updatedAt: { lte: redCutoff } } }),
    prisma.review.count({ where: { status: "DISPUTED", updatedAt: { lte: redCutoff } } }),
  ]);

  const toHealth = (
    kind: QueueKind,
    agg: { _count: { _all: number }; _min: { updatedAt: Date | null } },
    breaches: number
  ): QueueHealth => ({
    kind,
    depth: agg._count._all,
    oldestAgeHours: agg._min.updatedAt ? computeAgeHours(agg._min.updatedAt, now) : null,
    slaBreaches: breaches,
  });

  return [
    toHealth("COMPANY", companyAgg, companyBreaches),
    toHealth("SEEKER", seekerAgg, seekerBreaches),
    toHealth("JOB", jobAgg, jobBreaches),
    toHealth("REVIEW", reviewAgg, reviewBreaches),
  ];
}

// ============================================================================
// getDecisionStats — decisions by admin, by action, and the overturn rate.
// Derived entirely from `admin_audit_logs`; no schema change needed or made.
// A target with a prior REJECT-family action followed LATER by an
// APPROVE-family action on the same (targetType, targetId) is an overturn.
// ============================================================================

const REJECT_ACTIONS: AdminAuditAction[] = [
  "COMPANY_REJECT",
  "JOB_REJECT",
  "SEEKER_VERIFICATION_REJECT",
  "REVIEW_HIDE",
];
const APPROVE_ACTIONS: AdminAuditAction[] = [
  "COMPANY_APPROVE",
  "JOB_APPROVE",
  "SEEKER_VERIFICATION_APPROVE",
  "REVIEW_DISPUTE_RESOLVE",
];
const DECISION_ACTIONS: AdminAuditAction[] = [...REJECT_ACTIONS, ...APPROVE_ACTIONS];

type OverturnByAdminRow = { admin_user_id: string; overturns: number };

export type AdminDecisionStat = {
  adminUserId: string;
  /**
   * Nullable, not just optional: the `User` row backing an audit log's
   * `adminUserId` can be gone by the time this renders (admin accounts are
   * deletable; `admin_audit_logs` deliberately is NOT cascade-deleted, so
   * the accountability trail outlives the account). Render as "unknown
   * admin" — never throw, and never drop the row, since dropping it would
   * understate the overturn totals below.
   */
  adminEmail: string | null;
  total: number;
  approvals: number;
  rejections: number;
  overturnCount: number;
  /** Overturns / rejections for this admin, in the window. `null` when this admin made zero reject decisions in the window (never divide by zero, never show a fabricated 0%). */
  overturnRate: number | null;
};

export type DecisionStats = {
  since: Date;
  byAdmin: AdminDecisionStat[];
  byAction: Array<{ action: AdminAuditAction; count: number }>;
  overturns: {
    total: number;
    totalRejectDecisions: number;
    /** null when there were zero reject decisions in the window. */
    overturnRate: number | null;
  };
};

/** Default decision-stats lookback when `since` isn't given — the single source of truth (was previously duplicated per-caller; see the call sites in app/api/admin/queues/stats/route.ts and app/admin/queues/page.tsx). */
export const DEFAULT_DECISION_STATS_WINDOW_DAYS = 7;

export async function getDecisionStats(input?: { since?: Date }): Promise<DecisionStats> {
  // Computed here, not at the call site, so every caller (including RSCs,
  // where reading the clock during render trips react-hooks/purity) gets an
  // identical default without touching Date.now() themselves.
  const since =
    input?.since ?? new Date(Date.now() - DEFAULT_DECISION_STATS_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const [byAdminAction, overturnRows] = await Promise.all([
    prisma.adminAuditLog.groupBy({
      by: ["adminUserId", "action"] as const,
      where: { createdAt: { gte: since }, action: { in: DECISION_ACTIONS } },
      _count: { _all: true },
    }),
    // Self-join: for every REJECT-family row in the window, does a
    // LATER APPROVE-family row exist on the same target? COUNT DISTINCT the
    // target so a target that somehow gets multiple approvals after its
    // reject still counts as exactly one overturn. Grouped by the ORIGINAL
    // rejecting admin, since accountability for an overturn belongs to
    // whoever made the decision that didn't hold up — not whoever later
    // reversed it.
    prisma.$queryRaw<OverturnByAdminRow[]>`
      SELECT r.admin_user_id AS admin_user_id,
             COUNT(DISTINCT (r.target_type, r.target_id))::int AS overturns
      FROM admin_audit_logs r
      JOIN admin_audit_logs a
        ON a.target_type = r.target_type
       AND a.target_id = r.target_id
       AND a.action = ANY(${APPROVE_ACTIONS})
       AND a.created_at > r.created_at
      WHERE r.action = ANY(${REJECT_ACTIONS})
        AND r.created_at >= ${since}
      GROUP BY r.admin_user_id
    `,
  ]);

  // `AdminAuditLog.action` is plain TEXT at the schema level (see the
  // reason-code-style rationale in lib/admin/audit.ts), so `groupBy` infers
  // `action: string`, not the narrower `AdminAuditAction` union — cast at
  // the boundary since every row here was written through
  // `buildAdminActionOperation`/`recordAdminAction`, which only ever accept
  // an `AdminAuditAction`.
  const byActionMap = new Map<string, number>();
  const perAdmin = new Map<string, { approvals: number; rejections: number }>();
  for (const row of byAdminAction) {
    const action = row.action as AdminAuditAction;
    byActionMap.set(action, (byActionMap.get(action) ?? 0) + row._count._all);
    const entry = perAdmin.get(row.adminUserId) ?? { approvals: 0, rejections: 0 };
    if (REJECT_ACTIONS.includes(action)) entry.rejections += row._count._all;
    else entry.approvals += row._count._all;
    perAdmin.set(row.adminUserId, entry);
  }

  const overturnsByAdmin = new Map(overturnRows.map((r) => [r.admin_user_id, r.overturns]));

  // One batched lookup across every distinct admin id in the window — same
  // local pattern as batchPriorDecisionCounts/batchCompanyLiveJobCounts/
  // batchSeekerApplicationCounts above, never a query per admin.
  const adminEmails = await batchAdminEmails(Array.from(perAdmin.keys()));

  const byAdmin: AdminDecisionStat[] = Array.from(perAdmin.entries()).map(([adminUserId, counts]) => {
    const overturnCount = overturnsByAdmin.get(adminUserId) ?? 0;
    return {
      adminUserId,
      adminEmail: adminEmails.get(adminUserId) ?? null,
      total: counts.approvals + counts.rejections,
      approvals: counts.approvals,
      rejections: counts.rejections,
      overturnCount,
      overturnRate: counts.rejections > 0 ? overturnCount / counts.rejections : null,
    };
  });
  byAdmin.sort((a, b) => b.total - a.total);

  const byAction = Array.from(byActionMap.entries()).map(([action, count]) => ({
    action: action as AdminAuditAction,
    count,
  }));

  const totalRejectDecisions = byAdmin.reduce((sum, a) => sum + a.rejections, 0);
  const totalOverturns = byAdmin.reduce((sum, a) => sum + a.overturnCount, 0);

  return {
    since,
    byAdmin,
    byAction,
    overturns: {
      total: totalOverturns,
      totalRejectDecisions,
      overturnRate: totalRejectDecisions > 0 ? totalOverturns / totalRejectDecisions : null,
    },
  };
}
