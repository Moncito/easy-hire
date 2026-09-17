import type { ApplicationStatus, JobStatus, Prisma, Role, VerificationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";
import { getCompanyPlan, type SubscriptionPlan } from "@/lib/billing/subscriptions";
import { getSeekerProfileCompletion } from "@/lib/seeker/profile-completion";
import { requestPasswordReset, requestEmailVerification } from "@/lib/auth/credentials-recovery";
import { deleteUserAccountAsAdmin, type AccountDeletionResult } from "@/lib/account/account-deletion";
import { recordAdminAction, recordPiiRead } from "@/lib/admin/audit";
import { requireAdminPermission } from "@/lib/admin/permissions";
import type { TrustComputation } from "@/lib/admin/trust";
import type { PlatformDailyRollupMetrics } from "@/lib/admin/rollups";
import { adminUserActionSchema } from "@/lib/validations/admin";

/**
 * ADMIN DIRECTORY + 360-DEGREE USER RECORD — docs/ADMIN-CONSOLE-PLAN.md
 * §4.3, §3, Phase 2.
 * ============================================================================
 * Three read shapes, deliberately different in how "expensive" a call they are:
 *
 *  - `listUserDirectory` is a paginated TABLE — many rows, cheap fields only,
 *    no per-row audit write. This mirrors `listQueue` in lib/admin/queues.ts,
 *    which also renders no PII-sensitive detail and is not itself audited;
 *    only the single-item detail read (`getQueueItemDetail`) is.
 *  - `getUserDirectoryStats` / `getUserSignupTrend` back the analytics band
 *    ABOVE that table — unfiltered whole-platform snapshots/history, not
 *    scoped to whatever role/verified/search the table is currently showing.
 *    `getUserDirectoryStats` counts CURRENT live state (same live-query
 *    judgment call as `getQueueHealth` in lib/admin/queues.ts — "how many
 *    right now" is fine to ask the live tables). `getUserSignupTrend` is
 *    historical, so per lib/admin/rollups.ts's own module doc comment it
 *    reads `platform_daily_rollups` only, never a live table.
 *  - `getUserRecord` / `getCompanyDetail` (lib/admin/companies.ts) are
 *    single-TARGET reads — the full record for exactly one account — and
 *    DO write an audit row, on the same `after()` reliability contract as
 *    `ID_DOCUMENT_VIEWED` in lib/admin/queue-detail.ts: a read, not a
 *    decision, so it must never block the response it's attached to, but
 *    should still reliably land (see `recordPiiRead` in lib/admin/audit.ts).
 *
 * TWO ITEMS FROM §4.3 THAT ARE NOT BUILT HERE (see build-plan.md /
 * ADMIN-CONSOLE-PLAN.md §11 Phase 2 entry for the full reasoning):
 *  - "Current session count" — cut, not deferred. `Auth.ts` uses
 *    `session: { strategy: "jwt" }` and there is no `Session` model; JWTs are
 *    stateless, so there is nothing to count.
 *  - Suspend / restore — deferred. `User` has no status column, and adding
 *    one needs a `docs/build-plan.md` registry entry before any migration is
 *    written, which is out of scope for this read-only-directory task.
 * MRR contribution also stays out (Phase 6, blocked on payments).
 *
 * COUNTS, NOT LISTS (§4.3: "A user with 4,000 applications must not load
 * 4,000 rows into the record"). Every role-specific section below is built
 * from `count`/`groupBy`/`aggregate` calls, never a `findMany` over the
 * user's own history.
 */

// ============================================================================
// Directory — GET /api/admin/users
// ============================================================================

export type UserDirectoryVerifiedFilter = "VERIFIED" | "UNVERIFIED";

export type UserDirectoryItem = {
  id: string;
  email: string;
  role: Role;
  createdAt: Date;
  emailVerifiedAt: Date | null;
  /** Seeker's `fullName` or the company's `companyName` — null for ADMIN, which has neither. */
  displayName: string | null;
  /**
   * Seeker: `idVerificationStatus === "APPROVED"`. Employer: `Company.verifiedStatus === "APPROVED"`.
   * `null` for ADMIN — there is no verification concept for that role.
   */
  verified: boolean | null;
  trustScore: number | null;
  /**
   * Most recent `platform_events` row for this user, scoped to the CURRENT
   * PAGE only — filled in by one batched `groupBy` after the page is
   * fetched (see `listUserDirectory`), never a per-row query. `null` when
   * the account has no recorded event yet (pre-instrumentation history, or
   * simply never active) — same "no fabricated value" posture as the rest
   * of this file, just without a rate to null out.
   */
  lastActiveAt: Date | null;
};

/** Cursor is (createdAt, id), descending — same base64url-JSON codec shape as `EventCursor` in lib/admin/events.ts, just exported locally since this cursor is over `User`, not `PlatformEvent`. */
export type UserDirectoryCursor = { createdAt: Date; id: string };

export function encodeUserDirectoryCursor(cursor: UserDirectoryCursor): string {
  return Buffer.from(JSON.stringify({ createdAt: cursor.createdAt.toISOString(), id: cursor.id }), "utf8").toString(
    "base64url"
  );
}

export function decodeUserDirectoryCursor(raw: string): UserDirectoryCursor | null {
  try {
    const parsed = JSON.parse(Buffer.from(raw, "base64url").toString("utf8"));
    if (typeof parsed?.createdAt !== "string" || typeof parsed?.id !== "string") return null;
    const createdAt = new Date(parsed.createdAt);
    if (Number.isNaN(createdAt.getTime())) return null;
    return { createdAt, id: parsed.id };
  } catch {
    return null;
  }
}

export const DEFAULT_USER_DIRECTORY_LIMIT = 25;
export const MAX_USER_DIRECTORY_LIMIT = 100;

export type UserDirectoryListResult = { items: UserDirectoryItem[]; nextCursor: UserDirectoryCursor | null };

/**
 * NOT gated with an `adminUserId` parameter here — `app/admin/users/page.tsx`
 * (a Server Component, out of scope for this backend task) calls this
 * directly with no admin id beyond what `requireAdminPageContext` already
 * checked. `GET /api/admin/users` (the route also backed by this function)
 * IS gated with `requireAdminWithPermission(..., "user.read")` — see
 * app/api/admin/users/route.ts. Same judgment call, and same reasoning, as
 * lib/admin/jobs.ts's listJobDirectory doc comment.
 */
export async function listUserDirectory(params: {
  role?: Role;
  verified?: UserDirectoryVerifiedFilter;
  search?: string;
  cursor?: UserDirectoryCursor;
  limit?: number;
}): Promise<UserDirectoryListResult> {
  const limit = Math.min(Math.max(params.limit ?? DEFAULT_USER_DIRECTORY_LIMIT, 1), MAX_USER_DIRECTORY_LIMIT);

  // Every condition group lives in its own array slot, combined with `AND`,
  // rather than spreading multiple `{ OR: [...] }` objects into one literal —
  // the latter silently drops all but the last `OR` on key collision (spread
  // overwrites, it doesn't merge). `search` and `cursor` below would both hit
  // that if merged the other way, since both need their own `OR`.
  const and: Prisma.UserWhereInput[] = [];

  if (params.role) {
    and.push({ role: params.role });
  }

  if (params.search) {
    and.push({
      OR: [
        { email: { contains: params.search, mode: "insensitive" } },
        { seekerProfile: { fullName: { contains: params.search, mode: "insensitive" } } },
        { company: { companyName: { contains: params.search, mode: "insensitive" } } },
      ],
    });
  }

  if (params.verified === "VERIFIED") {
    and.push({
      OR: [{ seekerProfile: { idVerificationStatus: "APPROVED" } }, { company: { verifiedStatus: "APPROVED" } }],
    });
  } else if (params.verified === "UNVERIFIED") {
    // "Not verified" for whichever side actually applies to this row: a
    // seeker with no company must not be excluded by the company half of
    // this check, and vice versa — each half is trivially satisfied (true)
    // when that relation doesn't exist on this user at all.
    and.push({
      AND: [
        { OR: [{ seekerProfile: null }, { seekerProfile: { idVerificationStatus: { not: "APPROVED" } } }] },
        { OR: [{ company: null }, { company: { verifiedStatus: { not: "APPROVED" } } }] },
      ],
    });
  }

  if (params.cursor) {
    and.push({
      OR: [
        { createdAt: { lt: params.cursor.createdAt } },
        { createdAt: params.cursor.createdAt, id: { lt: params.cursor.id } },
      ],
    });
  }

  const rows = await prisma.user.findMany({
    where: and.length > 0 ? { AND: and } : undefined,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit + 1,
    select: {
      id: true,
      email: true,
      role: true,
      createdAt: true,
      emailVerifiedAt: true,
      seekerProfile: { select: { fullName: true, idVerificationStatus: true, trustScore: true } },
      company: { select: { companyName: true, verifiedStatus: true, trustScore: true } },
    },
  });

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const last = page[page.length - 1];
  const nextCursor = hasMore && last ? { createdAt: last.createdAt, id: last.id } : null;

  // ONE batched groupBy for the whole page's "last active" column, not a
  // query per row — same "COUNTS, NOT LISTS" discipline as the rest of this
  // file, applied to a MAX instead of a count. `_max.createdAt` is exactly
  // "most recent event" per user; `groupBy`'s `userId` column is nullable on
  // `PlatformEvent` in general (system/anonymous events), but every row this
  // query can match already has `userId IN (page ids)`, so it is never null
  // here — the `if (group.userId)` below is a type-narrowing formality, not
  // a real runtime branch.
  const pageUserIds = page.map((row) => row.id);
  const lastActiveGroups =
    pageUserIds.length > 0
      ? await prisma.platformEvent.groupBy({
          by: ["userId"],
          where: { userId: { in: pageUserIds } },
          _max: { createdAt: true },
        })
      : [];
  const lastActiveById = new Map<string, Date | null>();
  for (const group of lastActiveGroups) {
    if (group.userId) lastActiveById.set(group.userId, group._max.createdAt);
  }

  const items: UserDirectoryItem[] = page.map((row) => {
    const verified =
      row.role === "SEEKER"
        ? row.seekerProfile
          ? row.seekerProfile.idVerificationStatus === "APPROVED"
          : false
        : row.role === "EMPLOYER"
          ? row.company
            ? row.company.verifiedStatus === "APPROVED"
            : false
          : null;

    return {
      id: row.id,
      email: row.email,
      role: row.role,
      createdAt: row.createdAt,
      emailVerifiedAt: row.emailVerifiedAt,
      displayName: row.seekerProfile?.fullName ?? row.company?.companyName ?? null,
      verified,
      trustScore: row.seekerProfile?.trustScore ?? row.company?.trustScore ?? null,
      lastActiveAt: lastActiveById.get(row.id) ?? null,
    };
  });

  return { items, nextCursor };
}

// ============================================================================
// Directory analytics band — snapshot tiles + signup trend, `/admin/users`
// (docs/ADMIN-CONSOLE-PLAN.md §4.3). Deliberately NOT gated by the table's own
// role/verified/search filters — this is "how many accounts exist right now
// on the whole platform", independent of whatever the table happens to be
// scrolled/filtered to.
// ============================================================================

export type UserDirectoryStats = {
  totalUsers: number;
  seekerCount: number;
  employerCount: number;
  adminCount: number;
  /**
   * Verification snapshot over the two roles that actually have a
   * verification concept (seeker `idVerificationStatus`, employer
   * `verifiedStatus` — same fields `listUserDirectory`'s own `verified`
   * filter reads). ADMIN accounts are excluded from BOTH counts, not folded
   * into `unverifiedCount`: an admin was never submitted for review, so
   * counting it as "unverified" would misreport it as a rejected/pending
   * account rather than one the concept doesn't apply to — the same
   * distinction `UserDirectoryItem.verified: null` already draws for a
   * single row. Consequence for whoever renders this: `verifiedCount +
   * unverifiedCount === seekerCount + employerCount`, not `totalUsers`; the
   * gap is exactly `adminCount`.
   */
  verifiedCount: number;
  unverifiedCount: number;
};

export async function getUserDirectoryStats(): Promise<UserDirectoryStats> {
  const [roleGroups, verifiedCount, unverifiedCount] = await Promise.all([
    prisma.user.groupBy({ by: ["role"], _count: { _all: true } }),
    // Identical OR-condition shape to listUserDirectory's `verified === "VERIFIED"`
    // branch above, just run as a standalone whole-table count with no role/
    // search filter.
    prisma.user.count({
      where: {
        OR: [{ seekerProfile: { idVerificationStatus: "APPROVED" } }, { company: { verifiedStatus: "APPROVED" } }],
      },
    }),
    // Identical to the `verified === "UNVERIFIED"` branch above, plus an
    // explicit `role: { not: "ADMIN" }` — without it, an ADMIN row would
    // trivially satisfy both OR halves (it has neither a seekerProfile nor a
    // company) and get miscounted as "unverified" rather than excluded. See
    // the doc comment on UserDirectoryStats.unverifiedCount for why ADMIN is
    // excluded here instead of counted.
    prisma.user.count({
      where: {
        AND: [
          { role: { not: "ADMIN" } },
          { OR: [{ seekerProfile: null }, { seekerProfile: { idVerificationStatus: { not: "APPROVED" } } }] },
          { OR: [{ company: null }, { company: { verifiedStatus: { not: "APPROVED" } } }] },
        ],
      },
    }),
  ]);

  const countByRole = new Map(roleGroups.map((r) => [r.role, r._count._all]));
  const totalUsers = roleGroups.reduce((sum, r) => sum + r._count._all, 0);

  return {
    totalUsers,
    seekerCount: countByRole.get("SEEKER") ?? 0,
    employerCount: countByRole.get("EMPLOYER") ?? 0,
    adminCount: countByRole.get("ADMIN") ?? 0,
    verifiedCount,
    unverifiedCount,
  };
}

export type UserSignupTrendPoint = {
  date: Date;
  /** Sum of this row's `signupsByRole` values — a derived total of an already-stored breakdown, not a fabricated number. Same convention as `MarketplacePulseTrendPoint.signupsTotal` in lib/admin/home-dashboard.ts. */
  total: number;
  /** Exactly as stored in that day's `platform_daily_rollups` row — not recomputed. */
  byRole: Record<string, number>;
};

export const DEFAULT_USER_SIGNUP_TREND_DAYS = 30;

/**
 * Last `days` days of `platform_daily_rollups` — however many rows actually
 * exist, per this file's module doc comment ("Charts must read
 * `platform_daily_rollups`, never the live tables"). Does NOT pad,
 * interpolate, or backfill missing days: a marketplace with 6 stored rows
 * returns 6 points, not `days`.
 *
 * Deliberately a small standalone query rather than a call into
 * `getMarketplacePulseTrend` (lib/admin/home-dashboard.ts) — that function is
 * scoped to Home's Band-1 card and also carries `fillRate`/
 * `medianTimeToFirstApplicantHours`, neither of which this page needs.
 */
export async function getUserSignupTrend(days = DEFAULT_USER_SIGNUP_TREND_DAYS): Promise<UserSignupTrendPoint[]> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const rows = await prisma.platformDailyRollup.findMany({
    where: { date: { gte: since } },
    orderBy: { date: "asc" },
    select: { date: true, metrics: true },
  });

  return rows.map((row) => {
    const metrics = row.metrics as unknown as PlatformDailyRollupMetrics;
    const byRole = metrics.signupsByRole ?? {};
    const total = Object.values(byRole).reduce((sum, n) => sum + n, 0);
    return { date: row.date, total, byRole };
  });
}

// ============================================================================
// 360-degree record — GET /api/admin/users/[id]
// ============================================================================
// `recordPiiRead` (the audit helper used below) now lives in
// lib/admin/audit.ts — shared verbatim with getCompanyDetail in
// lib/admin/companies.ts. See its doc comment there for the reliability
// contract (same as ID_DOCUMENT_VIEWED).

const SEEKER_TARGET_TYPE = "SEEKER_PROFILE";
const USER_TARGET_TYPE = "USER";

export type UserRecordIdentity = {
  id: string;
  email: string;
  role: Role;
  emailVerifiedAt: Date | null;
  createdAt: Date;
  /** Derived from the most recent `platform_events` row for this user — never a Session-table read (there is none; see the module doc comment). */
  lastSeenAt: Date | null;
  /** `User.avatarUrl` — set via Google OAuth sign-in. Null for accounts that never signed in with Google. */
  avatarUrl: string | null;
};

export type UserRecordTrust = {
  trustScore: number | null;
  trustScoreUpdatedAt: Date | null;
  /** Component breakdown, as computed by lib/admin/trust.ts — explainable, not just a number. Null for ADMIN accounts and for accounts never scored yet. */
  trustSignals: TrustComputation | null;
  /** Seeker: `idVerificationStatus`. Employer: `verifiedStatus`. Null for ADMIN. */
  verificationStatus: VerificationStatus | null;
  reportsAgainstCount: number;
  reportsFiledCount: number;
};

export type SeekerRecordSection = {
  kind: "SEEKER";
  seekerProfileId: string;
  fullName: string;
  photoUrl: string | null;
  resumeUrl: string | null;
  profileCompletionPercent: number;
  applicationsByStatus: Record<ApplicationStatus, number>;
  totalApplications: number;
  savedJobsCount: number;
  jobAlertsCount: number;
};

export type EmployerRecordSection = {
  kind: "EMPLOYER";
  companyId: string;
  companyName: string;
  logoUrl: string | null;
  verifiedStatus: VerificationStatus;
  plan: SubscriptionPlan;
  jobsPosted: number;
  jobsApproved: number;
  jobsRejected: number;
  jobsPendingReview: number;
  applicationsReceived: number;
  responseRate: number | null;
  medianResponseMinutes: number | null;
  responseSampleSize: number | null;
  aiSpend: { totalCostMicroCents: number; callCount: number };
};

export type AdminRecordSection = { kind: "ADMIN" };

/**
 * Data-integrity fallback only — a `Role.SEEKER`/`Role.EMPLOYER` user whose
 * matching `SeekerProfile`/`Company` row doesn't exist (e.g. a signup that
 * failed partway through). Deliberately its own kind rather than silently
 * falling into `AdminRecordSection`, which would mislabel a broken account
 * as an admin.
 */
export type IncompleteRecordSection = { kind: "INCOMPLETE"; role: Role };

export type UserRecord = {
  identity: UserRecordIdentity;
  trust: UserRecordTrust;
  roleDetail: SeekerRecordSection | EmployerRecordSection | AdminRecordSection | IncompleteRecordSection;
};

const APPLICATION_STATUSES: ApplicationStatus[] = ["APPLIED", "SHORTLISTED", "INTERVIEW", "REJECTED", "HIRED"];

async function buildSeekerSection(seekerProfileId: string): Promise<SeekerRecordSection> {
  const profile = await prisma.seekerProfile.findUniqueOrThrow({
    where: { id: seekerProfileId },
    select: {
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

  const [statusGroups, savedJobsCount, jobAlertsCount] = await Promise.all([
    prisma.application.groupBy({ by: ["status"], where: { seekerId: seekerProfileId }, _count: { _all: true } }),
    prisma.savedJob.count({ where: { seekerId: seekerProfileId } }),
    prisma.jobAlert.count({ where: { seekerId: seekerProfileId } }),
  ]);

  const applicationsByStatus = Object.fromEntries(
    APPLICATION_STATUSES.map((status) => [status, 0])
  ) as Record<ApplicationStatus, number>;
  let totalApplications = 0;
  for (const row of statusGroups) {
    applicationsByStatus[row.status] = row._count._all;
    totalApplications += row._count._all;
  }

  const completion = getSeekerProfileCompletion(profile);
  const profileCompletionPercent = completion.total > 0 ? Math.round((completion.completed / completion.total) * 100) : 0;

  return {
    kind: "SEEKER",
    seekerProfileId,
    fullName: profile.fullName,
    photoUrl: profile.photoUrl,
    resumeUrl: profile.resumeUrl,
    profileCompletionPercent,
    applicationsByStatus,
    totalApplications,
    savedJobsCount,
    jobAlertsCount,
  };
}

async function buildEmployerSection(companyId: string): Promise<EmployerRecordSection> {
  const company = await prisma.company.findUniqueOrThrow({
    where: { id: companyId },
    select: {
      companyName: true,
      logoUrl: true,
      verifiedStatus: true,
      responseRate: true,
      medianResponseMinutes: true,
      responseSampleSize: true,
    },
  });

  const [plan, statusGroups, rejectedDraftCount, applicationsReceived, aiAgg] = await Promise.all([
    getCompanyPlan(companyId),
    prisma.job.groupBy({ by: ["status"], where: { companyId }, _count: { _all: true } }),
    prisma.job.count({ where: { companyId, status: "DRAFT", reviewRejectionReason: { not: null } } }),
    prisma.application.count({ where: { job: { companyId } } }),
    prisma.aiUsageEvent.aggregate({ where: { companyId }, _sum: { costMicroCents: true }, _count: { _all: true } }),
  ]);

  const countByStatus = new Map<JobStatus, number>(statusGroups.map((r) => [r.status, r._count._all]));
  const jobsPosted = statusGroups.reduce((sum, r) => sum + r._count._all, 0);
  const jobsApproved = (countByStatus.get("ACTIVE") ?? 0) + (countByStatus.get("CLOSED") ?? 0);
  const jobsPendingReview = countByStatus.get("PENDING_REVIEW") ?? 0;

  return {
    kind: "EMPLOYER",
    companyId,
    companyName: company.companyName,
    logoUrl: company.logoUrl,
    verifiedStatus: company.verifiedStatus,
    plan,
    jobsPosted,
    jobsApproved,
    jobsRejected: rejectedDraftCount,
    jobsPendingReview,
    applicationsReceived,
    responseRate: company.responseRate,
    medianResponseMinutes: company.medianResponseMinutes,
    responseSampleSize: company.responseSampleSize,
    aiSpend: {
      totalCostMicroCents: aiAgg._sum.costMicroCents ?? 0,
      callCount: aiAgg._count._all,
    },
  };
}

/**
 * The 360-degree record. Reads the target user once, then dispatches to the
 * seeker/employer/admin section builder — each of those is itself a small,
 * fixed number of aggregate queries scoped to ONE account, never a query per
 * related row. Records `USER_RECORD_VIEWED` via `recordPiiRead` (a read, not
 * a decision — see the module doc comment for the reliability contract this
 * shares with `ID_DOCUMENT_VIEWED`).
 */
export async function getUserRecord(adminUserId: string, targetUserId: string): Promise<UserRecord> {
  await requireAdminPermission(adminUserId, "user.read");

  const user = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: {
      id: true,
      email: true,
      role: true,
      emailVerifiedAt: true,
      createdAt: true,
      avatarUrl: true,
      seekerProfile: { select: { id: true, trustScore: true, trustScoreUpdatedAt: true, trustSignals: true, idVerificationStatus: true } },
      company: { select: { id: true, trustScore: true, trustScoreUpdatedAt: true, trustSignals: true, verifiedStatus: true } },
    },
  });

  if (!user) {
    throw new ApiError("User not found", 404);
  }

  const [lastEvent, reportsFiledCount] = await Promise.all([
    prisma.platformEvent.findFirst({
      where: { userId: targetUserId },
      orderBy: [{ createdAt: "desc" }],
      select: { createdAt: true },
    }),
    prisma.abuseReport.count({ where: { reporterUserId: targetUserId } }),
  ]);

  const reportsAgainstWhere: Prisma.AbuseReportWhereInput =
    user.role === "EMPLOYER" && user.company
      ? { OR: [{ targetType: USER_TARGET_TYPE, targetId: targetUserId }, { targetType: "COMPANY", targetId: user.company.id }] }
      : { targetType: USER_TARGET_TYPE, targetId: targetUserId };
  const reportsAgainstCount = await prisma.abuseReport.count({ where: reportsAgainstWhere });

  const trust: UserRecordTrust = {
    trustScore: user.seekerProfile?.trustScore ?? user.company?.trustScore ?? null,
    trustScoreUpdatedAt: user.seekerProfile?.trustScoreUpdatedAt ?? user.company?.trustScoreUpdatedAt ?? null,
    trustSignals: (user.seekerProfile?.trustSignals ?? user.company?.trustSignals ?? null) as TrustComputation | null,
    verificationStatus: user.seekerProfile?.idVerificationStatus ?? user.company?.verifiedStatus ?? null,
    reportsAgainstCount,
    reportsFiledCount,
  };

  const roleDetail: UserRecord["roleDetail"] =
    user.role === "ADMIN"
      ? { kind: "ADMIN" }
      : user.role === "SEEKER"
        ? user.seekerProfile
          ? await buildSeekerSection(user.seekerProfile.id)
          : { kind: "INCOMPLETE", role: user.role }
        : user.company
          ? await buildEmployerSection(user.company.id)
          : { kind: "INCOMPLETE", role: user.role };

  recordPiiRead(adminUserId, "USER_RECORD_VIEWED", USER_TARGET_TYPE, targetUserId);

  return {
    identity: {
      id: user.id,
      email: user.email,
      role: user.role,
      emailVerifiedAt: user.emailVerifiedAt,
      createdAt: user.createdAt,
      lastSeenAt: lastEvent?.createdAt ?? null,
      avatarUrl: user.avatarUrl,
    },
    trust,
    roleDetail,
  };
}

// ============================================================================
// Support actions — POST /api/admin/users/[id]/actions
// (docs/ADMIN-CONSOLE-PLAN.md §4.3's support-actions list, minus suspend/
// restore and impersonate — see the module doc comment for why).
// ============================================================================

export type UserSupportActionResult =
  | { action: "password_reset"; status: "sent" }
  | { action: "resend_verification"; status: "sent" }
  | { action: "resend_verification"; status: "already_verified" }
  | { action: "delete"; status: "deleted"; result: AccountDeletionResult };

/**
 * Each branch performs the action FIRST, then awaits `recordAdminAction`
 * (throws on failure, per that function's own doc comment in
 * lib/admin/audit.ts — "an admin decision that cannot be audited must not
 * silently proceed"). This ordering, not audit-then-act, is deliberate: none
 * of these three actions has a shared transaction to put the audit write
 * inside (unlike the four review/resolve paths, which use
 * `buildAdminActionOperation` inside their own `$transaction`), so acting
 * first means a failed audit write is reported as a real error rather than
 * a false "deleted"/"sent" audit trail for something that never happened.
 */
export async function performUserSupportAction(
  adminUserId: string,
  targetUserId: string,
  raw: unknown
): Promise<UserSupportActionResult> {
  const input = adminUserActionSchema.parse(raw);

  const user = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { id: true, email: true, emailVerifiedAt: true },
  });
  if (!user) {
    throw new ApiError("User not found", 404);
  }

  if (input.action === "password_reset") {
    await requireAdminPermission(adminUserId, "user.support");

    // Reuses lib/auth/credentials-recovery.ts's own token issuance — never
    // reimplemented here. Always resolves regardless of whether the account
    // has a password (no-op for Google-only accounts), matching that
    // function's existing enumeration-safe contract.
    await requestPasswordReset(user.email);
    await recordAdminAction({
      adminUserId,
      action: "USER_PASSWORD_RESET_TRIGGERED",
      targetType: USER_TARGET_TYPE,
      targetId: targetUserId,
      note: input.note,
    });
    return { action: "password_reset", status: "sent" };
  }

  if (input.action === "resend_verification") {
    await requireAdminPermission(adminUserId, "user.support");

    await requestEmailVerification(targetUserId);
    await recordAdminAction({
      adminUserId,
      action: "USER_VERIFICATION_RESEND_TRIGGERED",
      targetType: USER_TARGET_TYPE,
      targetId: targetUserId,
      note: input.note,
    });
    // requestEmailVerification is itself a no-op (no email sent) once the
    // account is already verified — surfaced here rather than guessed at,
    // so the admin UI never claims an email was sent when it wasn't.
    return {
      action: "resend_verification",
      status: user.emailVerifiedAt ? "already_verified" : "sent",
    };
  }

  // "delete" — the irreversible RA 10173 anonymisation path.
  // docs/ADMIN-CONSOLE-PLAN.md §6.7/§8.1's own worked example: gated on
  // `user.delete`, SUPER_ADMIN only, checked HERE rather than only at the
  // route — the route guard is defence in depth, not the only thing
  // standing between a support admin and an irreversible delete.
  await requireAdminPermission(adminUserId, "user.delete");

  // Reuses the existing anonymisation path in lib/account/account-deletion.ts,
  // never duplicated here. This is the admin-only entry point, which skips
  // the re-auth check an admin could never satisfy; authorisation is this
  // function's job (the permission check above, plus requireAdmin already
  // run at the route). The audit row is written immediately below.
  const result = await deleteUserAccountAsAdmin(targetUserId);
  await recordAdminAction({
    adminUserId,
    action: "USER_DELETED_BY_ADMIN",
    targetType: USER_TARGET_TYPE,
    targetId: targetUserId,
    note: input.note,
    before: { email: user.email },
    after: { anonymized: true },
  });
  return { action: "delete", status: "deleted", result };
}

// Re-exported so callers/tests can reference the SEEKER_PROFILE target-type
// string the same way lib/admin/queue-detail.ts's TARGET_TYPE_BY_KIND does,
// without duplicating the literal.
export const USER_RECORD_TARGET_TYPES = { USER: USER_TARGET_TYPE, SEEKER_PROFILE: SEEKER_TARGET_TYPE } as const;
