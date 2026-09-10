import { z } from "zod";
import {
  COMPANY_VERIFICATION_REASON_CODE_SET,
  JOB_POST_REASON_CODE_SET,
  SEEKER_ID_REASON_CODE_SET,
} from "@/lib/admin/reason-codes";
import { PLATFORM_EVENT_TYPES } from "@/lib/admin/events";

/**
 * Admin decision schemas — docs/ADMIN-CONSOLE-PLAN.md §4.2: "Decision
 * reasons are a controlled vocabulary, not free text. Enum plus optional
 * note." `reasonCode` is validated against the matching vocabulary in
 * lib/admin/reason-codes.ts ONLY on a reject decision; approvals take no
 * reason code (§4.2, and Company Pro's auto-publish note in CLAUDE.md is a
 * separate, unrelated "skip review" gate — this is about what a REJECT
 * carries once it does go through review).
 *
 * BACKWARD COMPATIBILITY: `reasonCode` is OPTIONAL on every schema below.
 * Existing admin pages post `{ action, reason }` with no `reasonCode` at
 * all — that keeps parsing and keeps working unchanged until the UI agent
 * adds the field. The free-text `reason` field is unchanged and is kept as
 * the human-readable note alongside the controlled code, not replaced by it.
 */

export const adminJobReviewSchema = z
  .object({
    action: z.enum(["approve", "reject"]),
    reason: z.string().max(500).optional(),
    reasonCode: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.reasonCode === undefined) return;
    if (data.action === "approve") {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["reasonCode"], message: "Approvals do not take a reason code." });
      return;
    }
    if (!JOB_POST_REASON_CODE_SET.has(data.reasonCode)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["reasonCode"], message: "Unrecognized reason code for a job rejection." });
    }
  });

export type AdminJobReviewInput = z.infer<typeof adminJobReviewSchema>;

export const adminCompanyReviewSchema = z
  .object({
    action: z.enum(["approve", "reject"]),
    reason: z.string().max(500).optional(),
    reasonCode: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.reasonCode === undefined) return;
    if (data.action === "approve") {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["reasonCode"], message: "Approvals do not take a reason code." });
      return;
    }
    if (!COMPANY_VERIFICATION_REASON_CODE_SET.has(data.reasonCode)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["reasonCode"], message: "Unrecognized reason code for a company rejection." });
    }
  });

export type AdminCompanyReviewInput = z.infer<typeof adminCompanyReviewSchema>;

export const adminSeekerVerificationReviewSchema = z
  .object({
    action: z.enum(["approve", "reject"]),
    reason: z.string().max(500).optional(),
    reasonCode: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.reasonCode === undefined) return;
    if (data.action === "approve") {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["reasonCode"], message: "Approvals do not take a reason code." });
      return;
    }
    if (!SEEKER_ID_REASON_CODE_SET.has(data.reasonCode)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["reasonCode"], message: "Unrecognized reason code for a seeker ID rejection." });
    }
  });

export type AdminSeekerVerificationReviewInput = z.infer<typeof adminSeekerVerificationReviewSchema>;

// ============================================================================
// Queue read endpoints (lib/admin/queues.ts) — app/api/admin/queues/*
// ============================================================================

export const ADMIN_QUEUE_KINDS = ["COMPANY", "SEEKER", "JOB", "REVIEW"] as const;
export const ADMIN_QUEUE_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;

/**
 * `cursor` arrives as an opaque, already-encoded string (see
 * `encodeQueueCursor`/`decodeQueueCursor` in lib/admin/queues.ts) — this
 * schema only bounds its length/shape as a string; decoding and validating
 * its contents is the queues module's job, not the route's.
 */
export const adminQueueListQuerySchema = z.object({
  kind: z.enum(ADMIN_QUEUE_KINDS),
  status: z.enum(ADMIN_QUEUE_STATUSES).optional(),
  search: z.string().trim().min(1).max(200).optional(),
  cursor: z.string().min(1).max(500).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export type AdminQueueListQuery = z.infer<typeof adminQueueListQuerySchema>;

export const adminQueueStatsQuerySchema = z.object({
  since: z.coerce.date().optional(),
});

export type AdminQueueStatsQuery = z.infer<typeof adminQueueStatsQuerySchema>;

// ============================================================================
// Per-item detail read — GET /api/admin/queues/[kind]/[id]
// (lib/admin/queue-detail.ts), the side-by-side review pane's data source
// (docs/ADMIN-CONSOLE-PLAN.md §4.2). `kind` reuses ADMIN_QUEUE_KINDS — one
// uppercase vocabulary across every admin queue endpoint (list, bulk,
// detail), never a lowercase/plural alias on the wire. `id` is only bounded
// as a non-empty string here; which target type it must resolve against is
// the lib's job (it 404s via ApiError, not Zod, when the id doesn't exist).
// ============================================================================

export const adminQueueDetailParamsSchema = z.object({
  kind: z.enum(ADMIN_QUEUE_KINDS),
  id: z.string().min(1, "id is required"),
});

export type AdminQueueDetailParams = z.infer<typeof adminQueueDetailParamsSchema>;

// ============================================================================
// Bulk moderation — POST /api/admin/queues/bulk, docs/ADMIN-CONSOLE-PLAN.md
// §4.2: "Bulk actions with a typed-confirmation step for rejections.
// Approve-many is fine; reject-many needs friction." This schema IS that
// friction for the bulk path — unlike the single-item schemas above, where
// `reasonCode` stays optional for backward compatibility with pages that
// predate the vocabulary, a bulk reject/hide has no such legacy caller and
// MUST carry a valid reasonCode or the whole request is rejected at the Zod
// boundary before lib/admin/bulk.ts ever runs.
//
// `action` spans two distinct vocabularies depending on `kind`:
// COMPANY/JOB/SEEKER use approve/reject (mirroring adminCompanyReviewSchema/
// adminJobReviewSchema/adminSeekerVerificationReviewSchema above); REVIEW
// uses restore/hide (mirroring adminReviewResolveSchema in
// lib/validations/review.ts). Both vocabularies are accepted on one flat
// wire shape (the client always sends a single JSON body regardless of
// kind) and cross-checked against `kind` in superRefine, rather than
// narrowed into a discriminated union — this is what "handle the difference
// explicitly at the mapping boundary" means here: the boundary is this
// superRefine, not a loosened shared enum.
//
// `reason` (COMPANY/JOB/SEEKER) and `note` (REVIEW) are both accepted on the
// same shape for the same reason — lib/admin/bulk.ts's orchestration layer
// picks the one that matches `kind` when calling into the four existing
// decision functions, which is where these field names originate
// (reviewCompany/reviewJob/reviewSeekerVerification read `reason`;
// resolveDisputedReview reads `note`).
// ============================================================================

export const ADMIN_BULK_QUEUE_ACTIONS = ["approve", "reject", "restore", "hide"] as const;
export type AdminBulkQueueAction = (typeof ADMIN_BULK_QUEUE_ACTIONS)[number];

/** Matches the task spec's cap exactly — a bulk call is where unbounded admin queries go to die (docs/ADMIN-CONSOLE-PLAN.md §10). */
export const MAX_BULK_QUEUE_IDS = 50;

const BULK_REASON_CODE_SETS: Record<"COMPANY" | "JOB" | "SEEKER", ReadonlySet<string>> = {
  COMPANY: COMPANY_VERIFICATION_REASON_CODE_SET,
  JOB: JOB_POST_REASON_CODE_SET,
  SEEKER: SEEKER_ID_REASON_CODE_SET,
};

export const adminBulkQueueReviewSchema = z
  .object({
    kind: z.enum(ADMIN_QUEUE_KINDS),
    ids: z
      .array(z.string().min(1))
      .min(1, "At least one id is required.")
      .max(MAX_BULK_QUEUE_IDS, `A bulk action may target at most ${MAX_BULK_QUEUE_IDS} items.`),
    action: z.enum(ADMIN_BULK_QUEUE_ACTIONS),
    reason: z.string().max(500).optional(),
    note: z.string().max(500).optional(),
    reasonCode: z.string().trim().max(64).optional(),
  })
  .superRefine((data, ctx) => {
    const isReviewKind = data.kind === "REVIEW";
    const validActions: AdminBulkQueueAction[] = isReviewKind ? ["restore", "hide"] : ["approve", "reject"];

    if (!validActions.includes(data.action)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["action"],
        message: `For kind ${data.kind}, action must be one of: ${validActions.join(", ")}.`,
      });
      return;
    }

    const isRejectLike = data.action === "reject" || data.action === "hide";

    if (!isRejectLike) {
      // approve/restore — no reason code, mirroring the approve branch of
      // adminCompanyReviewSchema/adminJobReviewSchema/
      // adminSeekerVerificationReviewSchema above.
      if (data.reasonCode !== undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["reasonCode"],
          message: "Approvals/restores do not take a reason code.",
        });
      }
      return;
    }

    // §4.2: reject-many needs friction. Mandatory here (never just optional
    // as on the single-item schemas) — this is the enforcement point.
    if (!data.reasonCode) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["reasonCode"],
        message: "A reason code is required for a bulk reject/hide.",
      });
      return;
    }

    if (isReviewKind) {
      // No controlled vocabulary was commissioned for review-dispute
      // resolution — see lib/admin/reason-codes.ts's header comment and the
      // matching note on adminReviewResolveSchema in
      // lib/validations/review.ts. Free-form, already length-bounded above.
      return;
    }

    const codeSet = BULK_REASON_CODE_SETS[data.kind as "COMPANY" | "JOB" | "SEEKER"];
    if (!codeSet.has(data.reasonCode)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["reasonCode"],
        message: `Unrecognized reason code for a bulk ${data.kind.toLowerCase()} rejection.`,
      });
    }
  });

export type AdminBulkQueueReviewInput = z.infer<typeof adminBulkQueueReviewSchema>;

// ============================================================================
// Phase 2 — Directory & 360-degree record (docs/ADMIN-CONSOLE-PLAN.md §4.3,
// §3). lib/admin/users.ts, lib/admin/companies.ts, lib/admin/jobs.ts.
// ============================================================================

export const ADMIN_USER_ROLES = ["SEEKER", "EMPLOYER", "ADMIN"] as const;
export const ADMIN_USER_VERIFIED_FILTERS = ["VERIFIED", "UNVERIFIED"] as const;

/** GET /api/admin/users — the directory list. Cursor is opaque; decoding/validating its contents is lib/admin/users.ts's job, same convention as adminQueueListQuerySchema above. */
export const adminUserDirectoryQuerySchema = z.object({
  role: z.enum(ADMIN_USER_ROLES).optional(),
  verified: z.enum(ADMIN_USER_VERIFIED_FILTERS).optional(),
  search: z.string().trim().min(1).max(200).optional(),
  cursor: z.string().min(1).max(500).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export type AdminUserDirectoryQuery = z.infer<typeof adminUserDirectoryQuerySchema>;

/** Shared `[id]` param shape for GET /api/admin/users/[id], its /activity and /actions sub-routes. */
export const adminUserDetailParamsSchema = z.object({
  id: z.string().min(1, "id is required"),
});

export type AdminUserDetailParams = z.infer<typeof adminUserDetailParamsSchema>;

/**
 * GET /api/admin/users/[id]/activity — the activity timeline. `eventType`
 * reuses the exact §7.1 whitelist from lib/admin/events.ts rather than a new
 * spelling of the same vocabulary (§4.3: "filterable by type").
 */
export const adminUserActivityQuerySchema = z.object({
  eventType: z.enum(PLATFORM_EVENT_TYPES).optional(),
  cursor: z.string().min(1).max(500).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
});

export type AdminUserActivityQuery = z.infer<typeof adminUserActivityQuerySchema>;

/**
 * POST /api/admin/users/[id]/actions — support actions (§4.3, minus
 * suspend/restore/impersonate — see lib/admin/users.ts's module doc comment
 * for why those are out of scope here). `note` is an optional free-text
 * attribution carried onto the `admin_audit_logs` row (e.g. a support ticket
 * reference), same field name/shape as the existing `note` on
 * `RecordAdminActionInput` in lib/admin/audit.ts.
 */
export const ADMIN_USER_SUPPORT_ACTIONS = ["password_reset", "resend_verification", "delete"] as const;

export const adminUserActionSchema = z.object({
  action: z.enum(ADMIN_USER_SUPPORT_ACTIONS),
  note: z.string().max(500).optional(),
});

export type AdminUserActionInput = z.infer<typeof adminUserActionSchema>;

/** GET /api/admin/companies/[id] (detail) — reuses the same `{ id }` shape as adminUserDetailParamsSchema, kept as its own named export so the companies route doesn't reach into the users vocabulary for an unrelated resource. */
export const adminCompanyDetailParamsSchema = z.object({
  id: z.string().min(1, "id is required"),
});

export type AdminCompanyDetailParams = z.infer<typeof adminCompanyDetailParamsSchema>;

/** GET /api/admin/jobs/directory — all-status job directory (distinct from the risk-ranked moderation queue at GET /api/admin/queues?kind=JOB, which only ever shows PENDING_REVIEW/ACTIVE/rejected-DRAFT). `status` spans every `JobStatus` value, including CLOSED and never-submitted DRAFT, neither of which the moderation queue ever surfaces. */
export const ADMIN_JOB_DIRECTORY_STATUSES = ["DRAFT", "PENDING_REVIEW", "ACTIVE", "CLOSED"] as const;

export const adminJobDirectoryQuerySchema = z.object({
  status: z.enum(ADMIN_JOB_DIRECTORY_STATUSES).optional(),
  search: z.string().trim().min(1).max(200).optional(),
  cursor: z.string().min(1).max(500).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export type AdminJobDirectoryQuery = z.infer<typeof adminJobDirectoryQuerySchema>;
