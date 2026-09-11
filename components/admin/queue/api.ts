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

export type QueueListApiResponse = { items: SerializedQueueItem[]; nextCursor: string | null };

async function readErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const body = await res.json();
    if (body && typeof body.error === "string") return body.error;
  } catch {
    // response wasn't JSON — fall through to the generic message
  }
  return fallback;
}

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

const SINGLE_DECISION_ENDPOINT: Record<QueueKind, (id: string) => string> = {
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
