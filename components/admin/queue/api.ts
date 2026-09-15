/**
 * Client-side fetch helpers for the unified moderation queue shell.
 * Talks only to the endpoints documented in docs/ADMIN-CONSOLE-PLAN.md §4.2:
 *  - GET  /api/admin/queues                      (list, cursor-paginated)
 *  - GET  /api/admin/queues/{KIND}/{id}           (per-item detail)
 *  - POST /api/admin/queues/bulk                  (bulk decision)
 *  - PATCH /api/admin/{companies,jobs,seekers/verifications,reviews}/{id}
 *          (single-item decision — the EXISTING per-kind endpoints)
 *
 * This file contains no business logic of its own — it only shapes fetch
 * calls and response typing for the components in this directory. It is not
 * under /lib, /app/api, or prisma/, so it is inside the UI agent's territory.
 */
import type { QueueKind, QueueStatus } from "@/lib/admin/queues";
import type { AdminBulkQueueAction } from "@/lib/validations/admin";
import type { BulkReviewQueueResult } from "@/lib/admin/bulk";
import type { SerializedQueueItem, SerializedQueueItemDetail } from "./types";
import { readErrorMessage } from "@/components/admin/apiHelpers";

export type QueueListApiResponse = { items: SerializedQueueItem[]; nextCursor: string | null };

export async function fetchQueuePage(params: {
  kind: QueueKind;
  status: QueueStatus;
  search?: string;
  cursor?: string | null;
  limit?: number;
}): Promise<QueueListApiResponse> {
  const qs = new URLSearchParams();
  qs.set("kind", params.kind);
  qs.set("status", params.status);
  if (params.search) qs.set("search", params.search);
  if (params.cursor) qs.set("cursor", params.cursor);
  qs.set("limit", String(params.limit ?? 25));

  const res = await fetch(`/api/admin/queues?${qs.toString()}`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Failed to load the queue."));
  }
  return res.json();
}

export async function fetchQueueItemDetail(kind: QueueKind, id: string): Promise<SerializedQueueItemDetail> {
  const res = await fetch(`/api/admin/queues/${kind}/${id}`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Failed to load this item."));
  }
  return res.json();
}

/**
 * REPORT is deliberately absent, and the type says so rather than the map
 * carrying a fake URL. Abuse reports have no single-item PATCH route: the
 * bulk endpoint already resolves them, so `resolveAbuseReport` is reached
 * with a one-element `ids` array instead of a fifth near-duplicate route
 * (see lib/admin/bulk.ts's REPORT branch). `submitSingleDecision` below
 * handles that fork explicitly — an `Exclude` here means adding a sixth kind
 * still fails to compile until someone decides which side it belongs on.
 */
const SINGLE_DECISION_ENDPOINT: Record<Exclude<QueueKind, "REPORT">, (id: string) => string> = {
  COMPANY: (id) => `/api/admin/companies/${id}`,
  JOB: (id) => `/api/admin/jobs/${id}`,
  SEEKER: (id) => `/api/admin/seekers/verifications/${id}`,
  REVIEW: (id) => `/api/admin/reviews/${id}`,
};

export type SingleDecisionResult = { ok: true } | { ok: false; error: string };

/**
 * Single-item decision. `body` is shaped by the caller — COMPANY/JOB/SEEKER
 * expect `{ action: "approve"|"reject", reason?, reasonCode? }`; REVIEW
 * expects `{ action: "restore"|"hide", note?, reasonCode? }` (different
 * vocabulary, per §4.2 of the plan).
 */
export async function submitSingleDecision(
  kind: QueueKind,
  id: string,
  body: Record<string, unknown>
): Promise<SingleDecisionResult> {
  // REPORT has no single-item route — see SINGLE_DECISION_ENDPOINT above.
  // Routed through the bulk endpoint with one id so the caller keeps one
  // uniform "decide this item" entry point and doesn't grow a fifth branch
  // of its own.
  if (kind === "REPORT") {
    const result = await submitBulkDecision({
      kind,
      ids: [id],
      action: body.action as AdminBulkQueueAction,
      reason: body.reason as string | undefined,
      note: body.note as string | undefined,
      reasonCode: body.reasonCode as string | undefined,
    });
    if (!result.ok) return { ok: false, error: result.error };
    // Bulk reports per-item outcomes rather than throwing, so a one-element
    // batch that "succeeded" at the HTTP level can still carry one failure —
    // unwrap it, or this would silently report a refused decision as saved.
    const item = result.result.results[0];
    if (item && !item.ok) {
      return { ok: false, error: item.error };
    }
    return { ok: true };
  }

  const res = await fetch(SINGLE_DECISION_ENDPOINT[kind](id), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    return { ok: false, error: await readErrorMessage(res, "This decision could not be saved.") };
  }
  return { ok: true };
}

export type BulkDecisionResult = { ok: true; result: BulkReviewQueueResult } | { ok: false; error: string };

export async function submitBulkDecision(input: {
  kind: QueueKind;
  ids: string[];
  action: AdminBulkQueueAction;
  reason?: string;
  note?: string;
  reasonCode?: string;
}): Promise<BulkDecisionResult> {
  const res = await fetch("/api/admin/queues/bulk", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    return { ok: false, error: await readErrorMessage(res, "The bulk action failed.") };
  }
  const result = (await res.json()) as BulkReviewQueueResult;
  return { ok: true, result };
}
