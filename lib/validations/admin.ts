import { z } from "zod";
import {
  COMPANY_VERIFICATION_REASON_CODE_SET,
  JOB_POST_REASON_CODE_SET,
  SEEKER_ID_REASON_CODE_SET,
} from "@/lib/admin/reason-codes";

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
