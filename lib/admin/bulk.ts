import type { QueueKind } from "@/lib/admin/queues";
import type { AdminBulkQueueAction } from "@/lib/validations/admin";
import { ApiError } from "@/lib/api-error";
import { reviewCompany } from "@/lib/admin/companies";
import { reviewJob } from "@/lib/admin/jobs";
import { reviewSeekerVerification } from "@/lib/admin/seekers";
import { resolveDisputedReview } from "@/lib/reviews";

/**
 * BULK MODERATION ORCHESTRATION — docs/ADMIN-CONSOLE-PLAN.md §4.2 "Bulk
 * actions with a typed-confirmation step for rejections."
 * ============================================================================
 * This module is ORCHESTRATION ONLY. It does not open a transaction, write a
 * notification, send an email, invalidate a cache, or insert an audit row —
 * every one of those already happens inside exactly one of the four existing
 * per-item decision functions it calls:
 *
 *   COMPANY -> reviewCompany               (lib/admin/companies.ts)
 *   JOB     -> reviewJob                   (lib/admin/jobs.ts)
 *   SEEKER  -> reviewSeekerVerification     (lib/admin/seekers.ts)
 *   REVIEW  -> resolveDisputedReview        (lib/reviews.ts)
 *
 * Each of those already runs its own `$transaction` with the audit insert
 * inside it (see lib/admin/audit.ts's `buildAdminActionOperation` — atomic
 * with the decision, either both land or neither does). Reimplementing any
 * of that here would risk a decision committing without its audit row, which
 * is exactly what that transactional pairing exists to prevent. So this file
 * only: dedupes ids, maps (kind, action) to the right function and the right
 * argument shape, runs the batch SEQUENTIALLY, and collects a per-item result.
 *
 * SEQUENTIAL, NOT Promise.all: each decision function opens its own DB
 * transaction and fires an email. A parallel fan-out over a 50-item batch
 * (the Zod-enforced cap — see MAX_BULK_QUEUE_IDS in lib/validations/admin.ts)
 * would spike the connection pool for no throughput benefit an admin would
 * notice on a batch this size. docs/ADMIN-CONSOLE-PLAN.md §10 is explicit
 * that the admin console is where unbounded/unbatched queries go to die —
 * this is the bounded, deliberately-sequential version of that rule.
 *
 * PARTIAL FAILURE: one bad id must never abort the batch. Each item is
 * caught individually; a bad id (not found, wrong status, failed validation)
 * fails only that item. `ApiError`'s message is surfaced as-is (it is
 * already written to be admin-facing — see lib/api-error.ts); anything else
 * (a raw Prisma error, a thrown non-Error) is replaced with a generic
 * message so an internal error string never reaches the client.
 */

export type BulkReviewItemResult = { id: string; ok: true } | { id: string; ok: false; error: string };

export type BulkReviewQueueResult = {
  succeeded: number;
  failed: number;
  results: BulkReviewItemResult[];
};

export type BulkReviewQueueItemsInput = {
  adminUserId: string;
  kind: QueueKind;
  /** May contain duplicates on the wire — deduped before processing so a repeated id can never produce two audit rows for one target. */
  ids: string[];
  action: AdminBulkQueueAction;
  /** COMPANY/JOB/SEEKER only — threaded straight through to reviewCompany/reviewJob/reviewSeekerVerification's `reason`. Ignored for REVIEW. */
  reason?: string;
  /** REVIEW only — threaded straight through to resolveDisputedReview's `note`. Ignored for COMPANY/JOB/SEEKER. */
  note?: string;
  /** Required by the Zod schema (lib/validations/admin.ts's adminBulkQueueReviewSchema) whenever `action` is reject-like; validated there against the matching controlled vocabulary. Passed through unvalidated here — this module trusts its caller already ran that schema, same as every other lib/admin/* decision function trusts its `raw` argument gets re-parsed by the callee's own schema. */
  reasonCode?: string;
};

/** Generic error message shown for anything that is not an `ApiError` — never leak a raw Prisma (or other) error string to the client. */
const GENERIC_ITEM_ERROR = "Failed to process this item. See server logs for details.";

/**
 * Maps (kind, action) to the one decision function that owns that target
 * type, and shapes the `raw` payload each one expects from its own Zod
 * schema (adminCompanyReviewSchema / adminJobReviewSchema /
 * adminSeekerVerificationReviewSchema / adminReviewResolveSchema — all in
 * lib/validations/{admin,review}.ts). This is the "mapping boundary" the
 * task spec calls out: REVIEW's restore/hide + note vocabulary is kept
 * distinct from the other three kinds' approve/reject + reason vocabulary
 * here, not merged into one shape passed uniformly to all four.
 */
function dispatchDecision(params: {
  adminUserId: string;
  kind: QueueKind;
  id: string;
  action: AdminBulkQueueAction;
  reason?: string;
  note?: string;
  reasonCode?: string;
}): Promise<unknown> {
  const { adminUserId, kind, id, action, reason, note, reasonCode } = params;

  switch (kind) {
    case "COMPANY":
      return reviewCompany(adminUserId, id, { action, reason, reasonCode });
    case "JOB":
      return reviewJob(adminUserId, id, { action, reason, reasonCode });
    case "SEEKER":
      return reviewSeekerVerification(adminUserId, id, { action, reason, reasonCode });
    case "REVIEW":
      return resolveDisputedReview(adminUserId, id, { action, note, reasonCode });
  }
}

/**
 * Runs one bulk decision across `ids`, sequentially, reusing the four
 * existing single-item decision functions for every side effect. See the
 * module doc comment above for the full rationale (orchestration-only,
 * sequential-not-parallel, partial-failure semantics).
 */
export async function bulkReviewQueueItems(input: BulkReviewQueueItemsInput): Promise<BulkReviewQueueResult> {
  const { adminUserId, kind, action, reason, note, reasonCode } = input;

  // Dedupe up front — a repeated id must resolve to exactly one decision
  // (and one audit row), not one per occurrence in the request body.
  const ids = Array.from(new Set(input.ids));

  const results: BulkReviewItemResult[] = [];
  let succeeded = 0;
  let failed = 0;

  // Sequential on purpose — see the module doc comment's SEQUENTIAL section.
  for (const id of ids) {
    try {
      await dispatchDecision({ adminUserId, kind, id, action, reason, note, reasonCode });
      results.push({ id, ok: true });
      succeeded += 1;
    } catch (error) {
      const message = error instanceof ApiError ? error.message : GENERIC_ITEM_ERROR;
      if (!(error instanceof ApiError)) {
        console.error(`[admin/bulk] item ${id} (${kind}) failed:`, error);
      }
      results.push({ id, ok: false, error: message });
      failed += 1;
    }
  }

  return { succeeded, failed, results };
}
