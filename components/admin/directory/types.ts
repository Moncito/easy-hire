/**
 * Client-side (serialized) mirrors of the server types in lib/admin/users.ts,
 * lib/admin/companies.ts, lib/admin/jobs.ts, lib/admin/events.ts and
 * lib/admin/trust.ts — the Phase 2 directory + 360-degree record
 * (docs/ADMIN-CONSOLE-PLAN.md §4.3, §3).
 *
 * Same convention as components/admin/queue/types.ts: server components pass
 * Prisma-derived data into client components via
 * `JSON.parse(JSON.stringify(...))`, which turns every `Date` into an ISO
 * string. Nothing here redefines business logic — it only re-types the wire
 * shape for the browser.
 */
import type {
  Role,
  VerificationStatus,
  ApplicationStatus,
  JobStatus,
  SalaryPeriod,
  CompanyMemberRole,
  CompanyMemberStatus,
} from "@prisma/client";
import type { SubscriptionPlan } from "@/lib/billing/subscriptions";
import type { TrustComponent } from "@/lib/admin/trust";
import type { PlatformEventType, ActorType } from "@/lib/admin/events";
import { ADMIN_JOB_DIRECTORY_STATUSES, type AdminUserActionInput } from "@/lib/validations/admin";
import type { UserDirectoryVerifiedFilter } from "@/lib/admin/users";

export type {
  Role,
  VerificationStatus,
  ApplicationStatus,
  JobStatus,
  SalaryPeriod,
  CompanyMemberRole,
  CompanyMemberStatus,
  SubscriptionPlan,
  PlatformEventType,
  ActorType,
};

// ============================================================================
// Directory — mirrors lib/admin/users.ts's UserDirectoryItem
// ============================================================================

export type SerializedUserDirectoryItem = {
  id: string;
  email: string;
  role: Role;
  createdAt: string;
  emailVerifiedAt: string | null;
  displayName: string | null;
  verified: boolean | null;
  trustScore: number | null;
};

export type { UserDirectoryVerifiedFilter };

// ============================================================================
// 360-degree record — mirrors lib/admin/users.ts's UserRecord
// ============================================================================

export type SerializedTrustComputation = {
  score: number;
  baseline: number;
  weightsVersion: number;
  computedAt: string;
  components: TrustComponent[];
};

export type SerializedUserRecordTrust = {
  trustScore: number | null;
  trustScoreUpdatedAt: string | null;
  trustSignals: SerializedTrustComputation | null;
  verificationStatus: VerificationStatus | null;
  reportsAgainstCount: number;
  reportsFiledCount: number;
};

export type SerializedSeekerRecordSection = {
  kind: "SEEKER";
  seekerProfileId: string;
  fullName: string;
  profileCompletionPercent: number;
  applicationsByStatus: Record<ApplicationStatus, number>;
  totalApplications: number;
  savedJobsCount: number;
  jobAlertsCount: number;
};

export type SerializedEmployerRecordSection = {
  kind: "EMPLOYER";
  companyId: string;
  companyName: string;
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

export type SerializedAdminRecordSection = { kind: "ADMIN" };
export type SerializedIncompleteRecordSection = { kind: "INCOMPLETE"; role: Role };

export type SerializedUserRecord = {
  identity: {
    id: string;
    email: string;
    role: Role;
    emailVerifiedAt: string | null;
    createdAt: string;
    lastSeenAt: string | null;
  };
  trust: SerializedUserRecordTrust;
  roleDetail:
    | SerializedSeekerRecordSection
    | SerializedEmployerRecordSection
    | SerializedAdminRecordSection
    | SerializedIncompleteRecordSection;
};

// ============================================================================
// Support actions — mirrors lib/admin/users.ts's UserSupportActionResult /
// lib/validations/admin.ts's adminUserActionSchema
// ============================================================================

export const USER_SUPPORT_ACTIONS = ["password_reset", "resend_verification", "delete"] as const;
export type UserSupportAction = (typeof USER_SUPPORT_ACTIONS)[number];
export type { AdminUserActionInput };

export type SerializedAccountDeletionResult = {
  seekerAnonymized: boolean;
  companyAnonymized: boolean;
  membershipsRemoved: number;
  jobsClosed: number;
};

export type SerializedUserSupportActionResult =
  | { action: "password_reset"; status: "sent" }
  | { action: "resend_verification"; status: "sent" }
  | { action: "resend_verification"; status: "already_verified" }
  | { action: "delete"; status: "deleted"; result: SerializedAccountDeletionResult };

// ============================================================================
// Activity timeline — mirrors lib/admin/events.ts's PlatformEvent read shape
// ============================================================================

export type SerializedPlatformEvent = {
  id: string;
  userId: string | null;
  actorType: ActorType;
  eventType: PlatformEventType;
  entityType: string | null;
  entityId: string | null;
  metadata: Record<string, string | number | boolean | null> | null;
  createdAt: string;
};

// ============================================================================
// Company detail — mirrors lib/admin/companies.ts's CompanyDetail
// ============================================================================

export type SerializedCompanyDetailMember = {
  id: string;
  userId: string;
  email: string;
  role: CompanyMemberRole;
  status: CompanyMemberStatus;
  joinedAt: string;
};

export type SerializedCompanyDetail = {
  companyId: string;
  companyName: string;
  email: string;
  industry: string | null;
  website: string | null;
  verifiedStatus: VerificationStatus;
  verificationRejectionReason: string | null;
  createdAt: string;
  trustScore: number | null;
  trustScoreUpdatedAt: string | null;
  plan: SubscriptionPlan;
  jobCounts: { active: number; pendingReview: number; closed: number; draft: number; total: number };
  members: SerializedCompanyDetailMember[];
  responseRate: number | null;
  medianResponseMinutes: number | null;
  responseSampleSize: number | null;
  aiSpend: { totalCostMicroCents: number; callCount: number };
  riskSignals: {
    reportsAgainstCount: number;
    jobRejections90dCount: number;
  };
};

// ============================================================================
// Job directory — mirrors lib/admin/jobs.ts's JobDirectoryItem
// ============================================================================

export type SerializedJobDirectoryItem = {
  id: string;
  title: string;
  companyId: string;
  companyName: string;
  category: string;
  status: JobStatus;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryPeriod: SalaryPeriod;
  updatedAt: string;
  publishedAt: string | null;
};

export { ADMIN_JOB_DIRECTORY_STATUSES };
