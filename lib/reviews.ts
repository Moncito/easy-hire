import { Prisma, type ApplicationStatus, type ReviewDirection, type ReviewStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";
import { unstable_cache, revalidateTag } from "next/cache";
import { reviveDates } from "@/lib/cache-utils";
import { getActiveCompanyMembership } from "@/lib/collaborative-hiring";
import { companyReviewsTag, seekerReviewsTag } from "@/lib/reviews-cache-tags";
import { ROLLUP_BATCH_SIZE } from "@/lib/employer/analytics-rollups";
import {
  reviewSubmitSchema,
  reviewDisputeSchema,
  adminReviewResolveSchema,
} from "@/lib/validations/review";

/**
 * TWO-WAY REVIEWS — business logic.
 * ===================================
 * Reviews unlock only from an Application that reached HIRED (see
 * prisma/schema.prisma's "TWO-WAY REVIEWS" section for the full data-model
 * rationale). This file owns:
 *  - eligibility (who can write a review, and when)
 *  - the double-blind reveal, including the simultaneous-submission race
 *  - publish-then-dispute moderation
 *  - read paths that must never leak a PENDING_REVEAL row publicly
 *  - the expiry sweep for the daily cron
 */

/** 14-day double-blind reveal window, anchored to Application.hiredAt. */
export const REVIEW_WINDOW_DAYS = 14;
const REVIEW_WINDOW_MS = REVIEW_WINDOW_DAYS * 24 * 60 * 60 * 1000;

/**
 * Statuses visible on ANY public read path. PENDING_REVEAL must never appear
 * here — not in a list, not in a count, not in an aggregate — or double-blind
 * is partially defeated (a subject could infer "the other side has/hasn't
 * submitted yet" from whether a row shows up at all). HIDDEN (an
 * admin-resolved dispute) is also excluded — it stays in the table for audit
 * history but is off both public surfaces.
 */
export const PUBLIC_REVIEW_STATUSES: ReviewStatus[] = ["PUBLISHED", "DISPUTED"];

export function isPubliclyVisibleReviewStatus(status: ReviewStatus): boolean {
  return status === "PUBLISHED" || status === "DISPUTED";
}

/** True while `now` is still inside the 14-day submission window after hiring. Inclusive at the boundary. */
export function isWithinReviewWindow(hiredAt: Date, now: Date): boolean {
  return now.getTime() - hiredAt.getTime() <= REVIEW_WINDOW_MS;
}

/** Complement of isWithinReviewWindow — used by the expiry sweep, never by eligibility. */
export function isReviewWindowExpired(hiredAt: Date, now: Date): boolean {
  return !isWithinReviewWindow(hiredAt, now);
}

/** Throws unless the application is HIRED, stamped, and still inside its review window. */
export function assertApplicationReviewable(
  application: { status: ApplicationStatus; hiredAt: Date | null },
  now: Date
): void {
  if (application.status !== "HIRED" || !application.hiredAt) {
    throw new ApiError("Reviews can only be written for an application that reached Hired.", 400);
  }
  if (!isWithinReviewWindow(application.hiredAt, now)) {
    throw new ApiError("The 14-day review window for this application has closed.", 400);
  }
}

export type ReviewAuthorRole = "SEEKER" | "COMPANY_MEMBER";

/**
 * Pure — derives *who* is writing. Direction is never accepted from the
 * client (a seeker must never be able to submit a review attributed to the
 * employer side); it is always derived server-side from this role.
 * `isActiveCompanyMember` is resolved by the caller (DB lookup) before this
 * is invoked, which is what keeps this function itself pure and unit-testable.
 */
export function resolveReviewAuthorRole(input: {
  userId: string;
  seekerUserId: string;
  isActiveCompanyMember: boolean;
}): ReviewAuthorRole {
  if (input.userId === input.seekerUserId) return "SEEKER";
  if (input.isActiveCompanyMember) return "COMPANY_MEMBER";
  throw new ApiError("You are not authorized to review this application.", 403);
}

export function directionForAuthorRole(role: ReviewAuthorRole): ReviewDirection {
  return role === "SEEKER" ? "SEEKER_TO_COMPANY" : "COMPANY_TO_SEEKER";
}

export function oppositeDirection(direction: ReviewDirection): ReviewDirection {
  return direction === "SEEKER_TO_COMPANY" ? "COMPANY_TO_SEEKER" : "SEEKER_TO_COMPANY";
}

/** Pure — the reveal decision once the opposite row's current status (or absence, as null) is known. */
export function shouldRevealOnSubmit(oppositeStatus: ReviewStatus | null): boolean {
  return oppositeStatus === "PENDING_REVEAL";
}

const REVIEW_TX_MAX_ATTEMPTS = 5;

function isSerializationFailure(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034";
}

/**
 * Runs `fn` inside a SERIALIZABLE transaction, retrying on a Postgres
 * serialization failure (surfaced by Prisma as error code P2034). See the
 * comment in submitReview for exactly which race this prevents and why
 * SERIALIZABLE (not a lower isolation level, and not just the app-level
 * pre-check) is required.
 */
async function runSerializable<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= REVIEW_TX_MAX_ATTEMPTS; attempt++) {
    try {
      return await prisma.$transaction(fn, { isolationLevel: "Serializable" });
    } catch (error) {
      lastError = error;
      if (!isSerializationFailure(error)) throw error;
      // Small jittered backoff so two retried transactions don't immediately re-collide.
      await new Promise((resolve) => setTimeout(resolve, 10 * attempt + Math.floor(Math.random() * 20)));
    }
  }
  throw lastError;
}

export async function submitReview(userId: string, raw: unknown) {
  const input = reviewSubmitSchema.parse(raw);

  const application = await prisma.application.findUnique({
    where: { id: input.applicationId },
    select: {
      id: true,
      status: true,
      hiredAt: true,
      seekerId: true,
      seeker: { select: { userId: true } },
      job: { select: { companyId: true } },
    },
  });
  if (!application) {
    throw new ApiError("Application not found", 404);
  }

  assertApplicationReviewable(application, new Date());

  const isSeeker = application.seeker.userId === userId;
  const isActiveCompanyMember = isSeeker
    ? false // skip the membership round-trip when the caller is unambiguously the seeker
    : Boolean(await getActiveCompanyMembership(application.job.companyId, userId));

  const role = resolveReviewAuthorRole({
    userId,
    seekerUserId: application.seeker.userId,
    isActiveCompanyMember,
  });
  const direction = directionForAuthorRole(role);

  const subjectCompanyId = direction === "SEEKER_TO_COMPANY" ? application.job.companyId : null;
  const subjectSeekerId = direction === "COMPANY_TO_SEEKER" ? application.seekerId : null;

  // Friendly pre-check outside the transaction — same "app check for UX, DB
  // constraint for truth" split as scheduleInterview in
  // lib/collaborative-interviews.ts. The @@unique([applicationId, direction])
  // constraint (caught as P2002 below) is what's actually authoritative
  // against a double-submit race.
  const existing = await prisma.review.findUnique({
    where: { applicationId_direction: { applicationId: application.id, direction } },
    select: { id: true },
  });
  if (existing) {
    throw new ApiError("You have already submitted a review for this application.", 409);
  }

  // Why SERIALIZABLE: two opposite-direction submissions can arrive within
  // milliseconds of each other. At the default Read Committed isolation, each
  // transaction's "does the opposite row exist yet?" read only sees rows
  // committed *before that statement ran* — so both transactions can commit
  // their own insert and each still observe "no opposite row" from the other,
  // because neither one's insert was committed yet when the other checked.
  // Both rows then sit at PENDING_REVEAL indefinitely (until the 14-day
  // sweep), which defeats "reveal immediately once both sides have
  // submitted." This is a textbook write-skew anomaly.
  //
  // Postgres's SERIALIZABLE (SSI) detects the read-write dependency cycle
  // this creates — T1's "no opposite row" read has a rw-antidependency on
  // T2's insert, and T2's equivalent read has one on T1's insert — and
  // aborts one of the two transactions with a serialization failure
  // (Prisma P2034) rather than letting both commit. runSerializable retries
  // that transaction; on retry it re-reads and now sees the other side's
  // already-committed row, so it correctly publishes both.
  let review;
  try {
    review = await runSerializable(async (tx) => {
      const created = await tx.review.create({
        data: {
          applicationId: application.id,
          authorUserId: userId,
          direction,
          subjectCompanyId,
          subjectSeekerId,
          rating: input.rating,
          body: input.body,
        },
      });

      const opposite = await tx.review.findUnique({
        where: {
          applicationId_direction: {
            applicationId: application.id,
            direction: oppositeDirection(direction),
          },
        },
        select: { id: true, status: true },
      });

      if (!shouldRevealOnSubmit(opposite?.status ?? null)) {
        return created;
      }

      const revealedAt = new Date();
      // Sequential, not Promise.all — both updates share one transaction
      // connection, so there is no concurrency benefit to parallelizing them
      // and sequential awaits keep the interactive transaction's query order
      // unambiguous.
      await tx.review.update({ where: { id: opposite!.id }, data: { status: "PUBLISHED", revealedAt } });
      return tx.review.update({ where: { id: created.id }, data: { status: "PUBLISHED", revealedAt } });
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new ApiError("You have already submitted a review for this application.", 409);
    }
    throw error;
  }

  if (review.status === "PUBLISHED") {
    invalidateCompanyReviews(application.job.companyId);
    invalidateSeekerReviews(application.seekerId);
  }

  return review;
}

type DisputeableReview = {
  direction: ReviewDirection;
  subjectCompanyId: string | null;
  subjectSeekerId: string | null;
  application: { seeker: { userId: string } };
};

async function isReviewSubjectUser(userId: string, review: DisputeableReview): Promise<boolean> {
  if (review.direction === "SEEKER_TO_COMPANY") {
    // Subject is the company — any active member may dispute on the company's behalf.
    if (!review.subjectCompanyId) return false;
    return Boolean(await getActiveCompanyMembership(review.subjectCompanyId, userId));
  }
  // COMPANY_TO_SEEKER — subject is the reviewed seeker.
  return review.application.seeker.userId === userId;
}

/** Only the subject of a PUBLISHED review may dispute it. Sets DISPUTED + reason + timestamp. */
export async function disputeReview(userId: string, reviewId: string, raw: unknown) {
  const input = reviewDisputeSchema.parse(raw);

  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    select: {
      id: true,
      status: true,
      direction: true,
      subjectCompanyId: true,
      subjectSeekerId: true,
      application: { select: { seeker: { select: { userId: true } } } },
    },
  });
  if (!review) {
    throw new ApiError("Review not found", 404);
  }

  const authorized = await isReviewSubjectUser(userId, review);
  if (!authorized) {
    throw new ApiError("You may only dispute a review written about you.", 403);
  }

  // Conditional updateMany (not update) so a double-click / already-disputed
  // review fails cleanly instead of silently overwriting a prior dispute.
  const updated = await prisma.review.updateMany({
    where: { id: reviewId, status: "PUBLISHED" },
    data: { status: "DISPUTED", disputeReason: input.reason, disputedAt: new Date() },
  });
  if (updated.count === 0) {
    throw new ApiError("Only a published review can be disputed.", 400);
  }

  if (review.subjectCompanyId) invalidateCompanyReviews(review.subjectCompanyId);
  if (review.subjectSeekerId) invalidateSeekerReviews(review.subjectSeekerId);

  return prisma.review.findUniqueOrThrow({ where: { id: reviewId } });
}

/** Admin resolution of a DISPUTED review: back to PUBLISHED, or HIDDEN (kept for audit, off public reads). */
export async function resolveDisputedReview(adminUserId: string, reviewId: string, raw: unknown) {
  const input = adminReviewResolveSchema.parse(raw);

  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    select: { id: true, status: true, subjectCompanyId: true, subjectSeekerId: true },
  });
  if (!review) {
    throw new ApiError("Review not found", 404);
  }

  const nextStatus: ReviewStatus = input.action === "restore" ? "PUBLISHED" : "HIDDEN";

  const updated = await prisma.review.updateMany({
    where: { id: reviewId, status: "DISPUTED" },
    data: {
      status: nextStatus,
      resolvedAt: new Date(),
      resolvedByUserId: adminUserId,
      resolutionNote: input.note?.trim() || null,
    },
  });
  if (updated.count === 0) {
    throw new ApiError("Only a disputed review can be resolved.", 400);
  }

  if (review.subjectCompanyId) invalidateCompanyReviews(review.subjectCompanyId);
  if (review.subjectSeekerId) invalidateSeekerReviews(review.subjectSeekerId);

  return prisma.review.findUniqueOrThrow({ where: { id: reviewId } });
}

// ============================================================================
// READ PATHS — only PUBLIC_REVIEW_STATUSES ever leave this module.
// ============================================================================

const PUBLIC_REVIEW_SELECT = {
  id: true,
  direction: true,
  rating: true,
  body: true,
  status: true,
  submittedAt: true,
  revealedAt: true,
  disputeReason: true,
  disputedAt: true,
  createdAt: true,
  application: {
    select: {
      id: true,
      job: {
        select: {
          id: true,
          title: true,
          company: { select: { id: true, companyName: true, logoUrl: true } },
        },
      },
      seeker: { select: { id: true, fullName: true, headline: true, photoUrl: true } },
    },
  },
} satisfies Prisma.ReviewSelect;

const REVIEWS_PAGE_SIZE = 20;
const REVIEWS_LIST_REVALIDATE_SECONDS = 60;
const REVIEWS_AGGREGATE_REVALIDATE_SECONDS = 60;

export async function listPublishedReviewsForCompany(companyId: string, page = 1) {
  const skip = Math.max(0, (page - 1) * REVIEWS_PAGE_SIZE);
  const rows = await unstable_cache(
    () =>
      prisma.review.findMany({
        where: { subjectCompanyId: companyId, status: { in: PUBLIC_REVIEW_STATUSES } },
        select: PUBLIC_REVIEW_SELECT,
        orderBy: { revealedAt: "desc" },
        skip,
        take: REVIEWS_PAGE_SIZE,
      }),
    ["company-reviews-list", companyId, String(page)],
    { revalidate: REVIEWS_LIST_REVALIDATE_SECONDS, tags: [companyReviewsTag(companyId)] }
  )();
  return reviveDates(rows);
}

export async function listPublishedReviewsForSeeker(seekerId: string, page = 1) {
  const skip = Math.max(0, (page - 1) * REVIEWS_PAGE_SIZE);
  const rows = await unstable_cache(
    () =>
      prisma.review.findMany({
        where: { subjectSeekerId: seekerId, status: { in: PUBLIC_REVIEW_STATUSES } },
        select: PUBLIC_REVIEW_SELECT,
        orderBy: { revealedAt: "desc" },
        skip,
        take: REVIEWS_PAGE_SIZE,
      }),
    ["seeker-reviews-list", seekerId, String(page)],
    { revalidate: REVIEWS_LIST_REVALIDATE_SECONDS, tags: [seekerReviewsTag(seekerId)] }
  )();
  return reviveDates(rows);
}

export type ReviewAggregate = { average: number | null; count: number };

/** Computed on read, not denormalized onto Company (per spec — this phase intentionally skips a rollup column). */
export async function getCompanyReviewAggregate(companyId: string): Promise<ReviewAggregate> {
  const result = await unstable_cache(
    async () => {
      const agg = await prisma.review.aggregate({
        where: { subjectCompanyId: companyId, status: { in: PUBLIC_REVIEW_STATUSES } },
        _avg: { rating: true },
        _count: { _all: true },
      });
      return { average: agg._avg.rating, count: agg._count._all };
    },
    ["company-reviews-aggregate", companyId],
    { revalidate: REVIEWS_AGGREGATE_REVALIDATE_SECONDS, tags: [companyReviewsTag(companyId)] }
  )();
  return reviveDates(result);
}

/** Computed on read, not denormalized onto SeekerProfile (same rationale as getCompanyReviewAggregate). */
export async function getSeekerReviewAggregate(seekerId: string): Promise<ReviewAggregate> {
  const result = await unstable_cache(
    async () => {
      const agg = await prisma.review.aggregate({
        where: { subjectSeekerId: seekerId, status: { in: PUBLIC_REVIEW_STATUSES } },
        _avg: { rating: true },
        _count: { _all: true },
      });
      return { average: agg._avg.rating, count: agg._count._all };
    },
    ["seeker-reviews-aggregate", seekerId],
    { revalidate: REVIEWS_AGGREGATE_REVALIDATE_SECONDS, tags: [seekerReviewsTag(seekerId)] }
  )();
  return reviveDates(result);
}

/** Drop cached review lists/aggregates for one company (call after a publish, dispute, or resolution touching it). */
export function invalidateCompanyReviews(companyId: string) {
  revalidateTag(companyReviewsTag(companyId), "max");
}

/** Drop cached review lists/aggregates for one seeker (same triggers as invalidateCompanyReviews). */
export function invalidateSeekerReviews(seekerId: string) {
  revalidateTag(seekerReviewsTag(seekerId), "max");
}

// ============================================================================
// REVEAL SWEEP — daily cron. Reveals PENDING_REVEAL rows whose 14-day window
// has expired even when only one side ever submitted.
// ============================================================================

/**
 * Idempotent by construction: the WHERE clause (both the select and the
 * per-row updateMany) only ever matches rows still PENDING_REVEAL, so a
 * second cron run — or this sweep racing a submit-triggered reveal on the
 * same row — matches zero rows the second time instead of double-revealing
 * or erroring.
 */
export async function sweepExpiredReviewReveals(now: Date = new Date()): Promise<{ revealed: number }> {
  const cutoff = new Date(now.getTime() - REVIEW_WINDOW_MS);

  const candidates = await prisma.review.findMany({
    where: { status: "PENDING_REVEAL", application: { hiredAt: { lt: cutoff } } },
    select: { id: true, subjectCompanyId: true, subjectSeekerId: true },
  });

  let revealed = 0;
  for (let i = 0; i < candidates.length; i += ROLLUP_BATCH_SIZE) {
    const batch = candidates.slice(i, i + ROLLUP_BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map(async (candidate) => {
        const updated = await prisma.review.updateMany({
          where: { id: candidate.id, status: "PENDING_REVEAL" },
          data: { status: "PUBLISHED", revealedAt: now },
        });
        if (updated.count > 0) {
          if (candidate.subjectCompanyId) invalidateCompanyReviews(candidate.subjectCompanyId);
          if (candidate.subjectSeekerId) invalidateSeekerReviews(candidate.subjectSeekerId);
        }
        return updated.count;
      })
    );
    for (const result of results) {
      if (result.status === "fulfilled") {
        revealed += result.value;
      } else {
        console.error("[reviews] expiry sweep failed for one review:", result.reason);
      }
    }
  }

  return { revealed };
}
