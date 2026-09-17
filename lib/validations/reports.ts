import { z } from "zod";
import { ABUSE_TARGET_TYPES, isValidAbuseReportReason } from "@/lib/admin/abuse-reports";

/**
 * PUBLIC abuse-report filing — POST /api/reports (app/api/reports/route.ts),
 * lib/admin/abuse-reports.ts's `fileAbuseReport`. Any signed-in user may
 * submit this; treat it as hostile input (§ task spec) — bounded `detail`
 * length, `reason` validated against the vocabulary for the given
 * `targetType` (no HTML passthrough; this is plain text stored verbatim,
 * never rendered as markup anywhere).
 *
 * This file imports FROM lib/admin/abuse-reports.ts (the vocabulary's
 * single source of truth), never the reverse — `resolveAbuseReport`'s own
 * Zod schema (`adminAbuseReportResolveSchema`) lives in
 * lib/validations/admin.ts instead of here specifically to avoid a circular
 * import between this file and lib/admin/abuse-reports.ts.
 */

/** Matches lib/admin/abuse-reports.ts's own `ABUSE_REPORT_DETAIL_MAX_LENGTH` — kept in sync by hand (a Zod schema and a /lib re-check are deliberately two independent bounds, same "defence in depth" precedent as every other admin decision schema in this codebase). */
export const ABUSE_REPORT_DETAIL_MAX_LENGTH = 2000;

/** A report reason code is a short controlled-vocabulary token, not prose — same bound as `reasonCode` elsewhere in lib/validations/admin.ts. */
const ABUSE_REPORT_REASON_MAX_LENGTH = 64;

export const reportFileSchema = z
  .object({
    targetType: z.enum(ABUSE_TARGET_TYPES),
    targetId: z.string().trim().min(1, "targetId is required"),
    reason: z.string().trim().min(1, "reason is required").max(ABUSE_REPORT_REASON_MAX_LENGTH),
    detail: z
      .string()
      .trim()
      .max(ABUSE_REPORT_DETAIL_MAX_LENGTH, `Detail is too long (${ABUSE_REPORT_DETAIL_MAX_LENGTH} characters maximum).`)
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (!isValidAbuseReportReason(data.targetType, data.reason)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["reason"],
        message: `Unrecognized report reason for target type ${data.targetType}.`,
      });
    }
  });

export type ReportFileInput = z.infer<typeof reportFileSchema>;
