import type {
  VerificationStatus,
  EmploymentType,
  SalaryPeriod,
  RemoteType,
  JobStatus,
  ReviewDirection,
  ReviewStatus,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";
import type { QueueKind } from "@/lib/admin/queues";
import { recordPiiRead, listAuditLog, type AdminAuditAction } from "@/lib/admin/audit";
import { VERIFICATION_DOC_BUCKET, resolveSignedUrl } from "@/lib/storage";

/**
 * PER-ITEM QUEUE DETAIL — docs/ADMIN-CONSOLE-PLAN.md §4.2: "Side-by-side
 * review pane. Document viewer left, decision form right, no navigation
 * between them. This is the single biggest throughput win — the current
 * flow makes you open a signed URL in a new tab and lose your place."
 * ============================================================================
 * `listQueue` (lib/admin/queues.ts) deliberately returns no documents in its
 * list payloads — a queue page is N rows, and minting a signed URL per
 * document on every row of every page would be a lot of Supabase Storage
 * calls for rows the reviewer never opens. This module is the read that
 * fills that gap for exactly ONE item, once the reviewer has actually
 * opened it: full record, signed document URLs, and prior decisions on the
 * same target so an appeal (queue item re-tagged `isAppeal`, per §4.2) is
 * reviewable against what happened last time.
 *
 * Each kind's shape is a SUPERSET of its list payload in lib/admin/queues.ts
 * (CompanyQueuePayload / SeekerQueuePayload / JobQueuePayload /
 * ReviewQueuePayload) — same field names where they overlap, plus whatever
 * the review pane needs that the list view doesn't: full description text,
 * documents, prior decisions. This file does not redefine or duplicate the
 * ranking/list logic in lib/admin/queues.ts.
 */

/** Prior-decision history is for context, not a full audit browser — bounded, same precedent as every other admin list in this codebase. */
const PRIOR_DECISIONS_TAKE = 10;

/** Matches the `targetType` strings the four decision functions already write via buildAdminActionOperation (lib/admin/{companies,jobs,seekers}.ts, lib/reviews.ts) — reused here, not reinvented. */
const TARGET_TYPE_BY_KIND: Record<QueueKind, string> = {
  COMPANY: "COMPANY",
  JOB: "JOB",
  SEEKER: "SEEKER_PROFILE",
  REVIEW: "REVIEW",
};

// ============================================================================
// Shared shapes
// ============================================================================

export type QueueItemDocument = {
  id: string;
  fileName: string;
  docType: string;
  uploadedAt: Date;
  /** Short-lived signed URL (lib/storage.ts's SIGNED_URL_TTL_SECONDS) — never a stored object path or a public URL. */
  fileUrl: string;
};

export type QueueItemPriorDecision = {
  action: AdminAuditAction;
  reasonCode: string | null;
  note: string | null;
  createdAt: Date;
  adminUserId: string;
};

export type CompanyQueueItemDetail = {
  kind: "COMPANY";
  companyId: string;
  companyName: string;
  industry: string | null;
  description: string | null;
  website: string | null;
  email: string;
  verifiedStatus: VerificationStatus;
  verificationRejectionReason: string | null;
  trustScore: number | null;
  jobs: { id: string; title: string; status: string }[];
  documents: QueueItemDocument[];
  priorDecisions: QueueItemPriorDecision[];
};

export type SeekerQueueItemDetail = {
  kind: "SEEKER";
  seekerProfileId: string;
  fullName: string;
  headline: string | null;
  bio: string | null;
  phone: string | null;
  location: string | null;
  email: string;
  idVerificationStatus: VerificationStatus | null;
  idVerificationRejectionReason: string | null;
  verificationScore: number;
  trustScore: number | null;
  documents: QueueItemDocument[];
  priorDecisions: QueueItemPriorDecision[];
};

export type JobQueueItemDetail = {
  kind: "JOB";
  jobId: string;
  title: string;
  description: string;
  requirements: string | null;
  benefits: string | null;
  category: string;
  industry: string | null;
  employmentType: EmploymentType;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryPeriod: SalaryPeriod;
  location: string;
  remoteType: RemoteType;
  status: JobStatus;
  reviewRejectionReason: string | null;
  company: {
    id: string;
    companyName: string;
    verifiedStatus: VerificationStatus;
    trustScore: number | null;
    email: string;
  };
  /** Always empty — no document model exists for jobs. Present (not omitted) so the review pane can render one shape across all four kinds, per the task spec. */
  documents: QueueItemDocument[];
  priorDecisions: QueueItemPriorDecision[];
};

export type ReviewQueueItemDetail = {
  kind: "REVIEW";
  reviewId: string;
  direction: ReviewDirection;
  rating: number;
  body: string;
  status: ReviewStatus;
  disputeReason: string | null;
  disputedAt: Date | null;
  /** Whoever wrote the review — seeker for SEEKER_TO_COMPANY, the reviewing company for COMPANY_TO_SEEKER. */
  authorName: string;
  /** Whoever the review is ABOUT — the opposite side from `authorName`. Matches the subject mapping in lib/admin/queues.ts's listReviewQueue and lib/reviews.ts's isReviewSubjectUser. */
  subjectName: string;
  subjectCompanyId: string | null;
  subjectSeekerId: string | null;
  /** Always empty — reviews carry no documents. Present for the same one-shape reason as JobQueueItemDetail.documents. */
  documents: QueueItemDocument[];
  priorDecisions: QueueItemPriorDecision[];
};

export type QueueItemDetail =
  | CompanyQueueItemDetail
  | SeekerQueueItemDetail
  | JobQueueItemDetail
  | ReviewQueueItemDetail;

// ============================================================================
// Shared helpers
// ============================================================================

/** Signs every document's fileUrl in parallel (never sequential) — exact same pattern as lib/admin/companies.ts's listPendingCompanies / lib/admin/seekers.ts's listPendingSeekerVerifications. */
async function signDocuments(
  docs: { id: string; fileUrl: string; fileName: string; docType: string; uploadedAt: Date }[]
): Promise<QueueItemDocument[]> {
  return Promise.all(
    docs.map(async (doc) => ({
      id: doc.id,
      fileName: doc.fileName,
      docType: doc.docType,
      uploadedAt: doc.uploadedAt,
      fileUrl: (await resolveSignedUrl(VERIFICATION_DOC_BUCKET, doc.fileUrl)) ?? "",
    }))
  );
}

async function fetchPriorDecisions(targetType: string, targetId: string): Promise<QueueItemPriorDecision[]> {
  const { logs } = await listAuditLog({ targetType, targetId, limit: PRIOR_DECISIONS_TAKE });
  return logs.map((log) => ({
    // AdminAuditLog.action is plain TEXT at the schema level (see the
    // reason-code-style rationale in lib/admin/audit.ts), so this cast at
    // the boundary matches getDecisionStats's identical cast in
    // lib/admin/queues.ts — every row here was written through
    // buildAdminActionOperation/recordAdminAction, which only ever accept
    // an AdminAuditAction.
    action: log.action as AdminAuditAction,
    reasonCode: log.reasonCode,
    note: log.note,
    createdAt: log.createdAt,
    adminUserId: log.adminUserId,
  }));
}

/**
 * Records `ID_DOCUMENT_VIEWED` for a privacy-sensitive document read (§8.3).
 *
 * This used to be a local copy of the `after()`-based fire-and-forget helper.
 * Phase 2 needed the identical behaviour for `USER_RECORD_VIEWED` and
 * `COMPANY_RECORD_VIEWED`, so the helper now lives once in lib/admin/audit.ts
 * as `recordPiiRead` — see its doc comment for why a PII READ deliberately
 * does not follow `recordAdminAction`'s awaited contract, and why it uses
 * `after()` rather than a bare floating promise.
 */
function recordDocumentViewed(adminUserId: string, targetType: string, targetId: string): void {
  recordPiiRead(adminUserId, "ID_DOCUMENT_VIEWED", targetType, targetId);
}

// ============================================================================
// COMPANY
// ============================================================================

async function getCompanyQueueItemDetail(adminUserId: string, companyId: string): Promise<CompanyQueueItemDetail> {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: {
      id: true,
      companyName: true,
      industry: true,
      description: true,
      website: true,
      verifiedStatus: true,
      verificationRejectionReason: true,
      trustScore: true,
      user: { select: { email: true } },
      // Same "live jobs" filter as lib/admin/companies.ts's listPendingCompanies —
      // the population either already visible to seekers or about to become so.
      jobs: {
        where: { status: { in: ["ACTIVE", "PENDING_REVIEW"] } },
        select: { id: true, title: true, status: true },
        orderBy: { updatedAt: "desc" },
      },
      verificationDocuments: { orderBy: { uploadedAt: "desc" } },
    },
  });

  if (!company) {
    throw new ApiError("Company not found", 404);
  }

  const documents = await signDocuments(company.verificationDocuments);
  if (documents.length > 0) {
    recordDocumentViewed(adminUserId, TARGET_TYPE_BY_KIND.COMPANY, companyId);
  }

  const priorDecisions = await fetchPriorDecisions(TARGET_TYPE_BY_KIND.COMPANY, companyId);

  return {
    kind: "COMPANY",
    companyId: company.id,
    companyName: company.companyName,
    industry: company.industry,
    description: company.description,
    website: company.website,
    email: company.user.email,
    verifiedStatus: company.verifiedStatus,
    verificationRejectionReason: company.verificationRejectionReason,
    trustScore: company.trustScore,
    jobs: company.jobs,
    documents,
    priorDecisions,
  };
}

// ============================================================================
// SEEKER
// ============================================================================

async function getSeekerQueueItemDetail(adminUserId: string, seekerProfileId: string): Promise<SeekerQueueItemDetail> {
  const profile = await prisma.seekerProfile.findUnique({
    where: { id: seekerProfileId },
    select: {
      id: true,
      fullName: true,
      headline: true,
      bio: true,
      phone: true,
      location: true,
      idVerificationStatus: true,
      idVerificationRejectionReason: true,
      verificationScore: true,
      trustScore: true,
      user: { select: { email: true } },
      identityDocuments: { orderBy: { uploadedAt: "desc" } },
    },
  });

  if (!profile) {
    throw new ApiError("Seeker profile not found", 404);
  }

  const documents = await signDocuments(profile.identityDocuments);
  if (documents.length > 0) {
    recordDocumentViewed(adminUserId, TARGET_TYPE_BY_KIND.SEEKER, seekerProfileId);
  }

  const priorDecisions = await fetchPriorDecisions(TARGET_TYPE_BY_KIND.SEEKER, seekerProfileId);

  return {
    kind: "SEEKER",
    seekerProfileId: profile.id,
    fullName: profile.fullName,
    headline: profile.headline,
    bio: profile.bio,
    phone: profile.phone,
    location: profile.location,
    email: profile.user.email,
    idVerificationStatus: profile.idVerificationStatus,
    idVerificationRejectionReason: profile.idVerificationRejectionReason,
    verificationScore: profile.verificationScore,
    trustScore: profile.trustScore,
    documents,
    priorDecisions,
  };
}

// ============================================================================
// JOB — no document model exists for this kind; `documents` is always [].
// ============================================================================

async function getJobQueueItemDetail(jobId: string): Promise<JobQueueItemDetail> {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: {
      id: true,
      title: true,
      description: true,
      requirements: true,
      benefits: true,
      category: true,
      industry: true,
      employmentType: true,
      salaryMin: true,
      salaryMax: true,
      salaryPeriod: true,
      location: true,
      remoteType: true,
      status: true,
      reviewRejectionReason: true,
      company: {
        select: {
          id: true,
          companyName: true,
          verifiedStatus: true,
          trustScore: true,
          user: { select: { email: true } },
        },
      },
    },
  });

  if (!job) {
    throw new ApiError("Job not found", 404);
  }

  const priorDecisions = await fetchPriorDecisions(TARGET_TYPE_BY_KIND.JOB, jobId);

  return {
    kind: "JOB",
    jobId: job.id,
    title: job.title,
    description: job.description,
    requirements: job.requirements,
    benefits: job.benefits,
    category: job.category,
    industry: job.industry,
    employmentType: job.employmentType,
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax,
    salaryPeriod: job.salaryPeriod,
    location: job.location,
    remoteType: job.remoteType,
    status: job.status,
    reviewRejectionReason: job.reviewRejectionReason,
    company: {
      id: job.company.id,
      companyName: job.company.companyName,
      verifiedStatus: job.company.verifiedStatus,
      trustScore: job.company.trustScore,
      email: job.company.user.email,
    },
    documents: [],
    priorDecisions,
  };
}

// ============================================================================
// REVIEW — no document model exists for this kind; `documents` is always [].
// ============================================================================

async function getReviewQueueItemDetail(reviewId: string): Promise<ReviewQueueItemDetail> {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    select: {
      id: true,
      direction: true,
      rating: true,
      body: true,
      status: true,
      disputeReason: true,
      disputedAt: true,
      subjectCompanyId: true,
      subjectSeekerId: true,
      application: {
        select: {
          job: { select: { company: { select: { companyName: true } } } },
          seeker: { select: { fullName: true } },
        },
      },
    },
  });

  if (!review) {
    throw new ApiError("Review not found", 404);
  }

  // Author/subject mapping mirrors lib/reviews.ts's isReviewSubjectUser and
  // lib/admin/queues.ts's listReviewQueue subjectName derivation: a
  // SEEKER_TO_COMPANY review was written BY the seeker, ABOUT the company;
  // COMPANY_TO_SEEKER is the reverse.
  const seekerName = review.application.seeker.fullName;
  const companyName = review.application.job.company.companyName;
  const authorName = review.direction === "SEEKER_TO_COMPANY" ? seekerName : companyName;
  const subjectName = review.direction === "SEEKER_TO_COMPANY" ? companyName : seekerName;

  const priorDecisions = await fetchPriorDecisions(TARGET_TYPE_BY_KIND.REVIEW, reviewId);

  return {
    kind: "REVIEW",
    reviewId: review.id,
    direction: review.direction,
    rating: review.rating,
    body: review.body,
    status: review.status,
    disputeReason: review.disputeReason,
    disputedAt: review.disputedAt,
    authorName,
    subjectName,
    subjectCompanyId: review.subjectCompanyId,
    subjectSeekerId: review.subjectSeekerId,
    documents: [],
    priorDecisions,
  };
}

// ============================================================================
// Public entry point — dispatches to the kind-specific fetcher above. Mirrors
// listQueue's own dispatch switch in lib/admin/queues.ts.
// ============================================================================

export async function getQueueItemDetail(input: {
  adminUserId: string;
  kind: QueueKind;
  id: string;
}): Promise<QueueItemDetail> {
  const { adminUserId, kind, id } = input;

  switch (kind) {
    case "COMPANY":
      return getCompanyQueueItemDetail(adminUserId, id);
    case "SEEKER":
      return getSeekerQueueItemDetail(adminUserId, id);
    case "JOB":
      return getJobQueueItemDetail(id);
    case "REVIEW":
      return getReviewQueueItemDetail(id);
  }
}
