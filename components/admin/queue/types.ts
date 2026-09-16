/**
 * Client-side (serialized) mirrors of the server types in lib/admin/queues.ts
 * and lib/admin/queue-detail.ts.
 *
 * Server components pass Prisma-derived data into client components via
 * `JSON.parse(JSON.stringify(...))` (the existing pattern in every current
 * admin page — see app/admin/companies/page.tsx). That round-trip turns every
 * `Date` into an ISO string, so the shapes below are identical to the /lib
 * exports except `Date` -> `string`. This file does not redefine any
 * business logic — it only re-types the wire shape for the browser.
 */
import type {
  QueueKind,
  QueueStatus,
  SlaBand,
  QueueSeveritySignal,
  CompanyQueuePayload,
  SeekerQueuePayload,
  JobQueuePayload,
  ReviewQueuePayload,
} from "@/lib/admin/queues";
import type { AdminAuditAction } from "@/lib/admin/audit";

export type { QueueKind, QueueStatus, SlaBand, QueueSeveritySignal };
export type {
  CompanyQueuePayload,
  SeekerQueuePayload,
  JobQueuePayload,
  ReviewQueuePayload,
};

export type SerializedQueueItem = {
  id: string;
  kind: QueueKind;
  title: string;
  subtitle: string;
  submittedAt: string;
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

export type SerializedQueueItemDocument = {
  id: string;
  fileName: string;
  docType: string;
  uploadedAt: string;
  fileUrl: string;
};

export type SerializedQueueItemPriorDecision = {
  action: AdminAuditAction;
  reasonCode: string | null;
  note: string | null;
  createdAt: string;
  adminUserId: string;
};

/**
 * Serialized mirror of lib/admin/queue-detail.ts's JobLiveState — the
 * truthful live/expired state for a job in the COMPANY detail's "Live Jobs"
 * list, derived from `status` + `expiresAt` rather than `status` alone.
 * See that file's JobLiveState doc comment for what each value means.
 */
export type SerializedJobLiveState = "ACTIVE_LIVE" | "ACTIVE_EXPIRED" | "PENDING_REVIEW";

export type SerializedCompanyQueueItemDetail = {
  kind: "COMPANY";
  companyId: string;
  companyName: string;
  logoUrl: string | null;
  industry: string | null;
  description: string | null;
  website: string | null;
  email: string;
  verifiedStatus: string;
  verificationRejectionReason: string | null;
  trustScore: number | null;
  /** Same `updatedAt`-as-proxy convention as lib/admin/queue-detail.ts's `CompanyQueueItemDetail.submittedAt` — see that field's doc comment. */
  submittedAt: string;
  jobs: { id: string; title: string; status: string; expiresAt: string | null; liveState: SerializedJobLiveState }[];
  documents: SerializedQueueItemDocument[];
  priorDecisions: SerializedQueueItemPriorDecision[];
};

export type SerializedSeekerQueueItemDetail = {
  kind: "SEEKER";
  seekerProfileId: string;
  fullName: string;
  photoUrl: string | null;
  headline: string | null;
  bio: string | null;
  phone: string | null;
  location: string | null;
  email: string;
  idVerificationStatus: string | null;
  idVerificationRejectionReason: string | null;
  verificationScore: number;
  trustScore: number | null;
  /** Same `updatedAt`-as-proxy convention as lib/admin/queue-detail.ts's `SeekerQueueItemDetail.submittedAt` — see that field's doc comment. */
  submittedAt: string;
  documents: SerializedQueueItemDocument[];
  priorDecisions: SerializedQueueItemPriorDecision[];
};

export type SerializedJobQueueItemDetail = {
  kind: "JOB";
  jobId: string;
  title: string;
  description: string;
  requirements: string | null;
  benefits: string | null;
  category: string;
  industry: string | null;
  employmentType: string;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryPeriod: string;
  location: string;
  remoteType: string;
  status: string;
  reviewRejectionReason: string | null;
  company: {
    id: string;
    companyName: string;
    verifiedStatus: string;
    trustScore: number | null;
    email: string;
  };
  documents: SerializedQueueItemDocument[];
  priorDecisions: SerializedQueueItemPriorDecision[];
};

export type SerializedReviewQueueItemDetail = {
  kind: "REVIEW";
  reviewId: string;
  direction: string;
  rating: number;
  body: string;
  status: string;
  disputeReason: string | null;
  disputedAt: string | null;
  authorName: string;
  subjectName: string;
  subjectCompanyId: string | null;
  subjectSeekerId: string | null;
  documents: SerializedQueueItemDocument[];
  priorDecisions: SerializedQueueItemPriorDecision[];
};

export type SerializedQueueItemDetail =
  | SerializedCompanyQueueItemDetail
  | SerializedSeekerQueueItemDetail
  | SerializedJobQueueItemDetail
  | SerializedReviewQueueItemDetail;

export type ReasonCodeOption = { code: string; label: string };
