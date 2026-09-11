/**
 * Client-side fetch helpers for the Phase 2 directory + 360-degree record
 * (docs/ADMIN-CONSOLE-PLAN.md §4.3, §3). Talks only to the endpoints
 * documented in the task brief:
 *  - GET  /api/admin/users                    (directory, cursor-paginated)
 *  - GET  /api/admin/users/[id]/activity       (activity timeline)
 *  - POST /api/admin/users/[id]/actions        (support actions)
 *  - GET  /api/admin/jobs/directory            (all-status job directory)
 *
 * No business logic lives here — only fetch shaping, same rationale as
 * components/admin/queue/api.ts. Not under /lib, /app/api, or prisma/.
 */
import type {
  Role,
  JobStatus,
  SerializedUserDirectoryItem,
  SerializedJobDirectoryItem,
  SerializedPlatformEvent,
  UserDirectoryVerifiedFilter,
  PlatformEventType,
  UserSupportAction,
  SerializedUserSupportActionResult,
} from "./types";

export type UserDirectoryApiResponse = { items: SerializedUserDirectoryItem[]; nextCursor: string | null };
export type JobDirectoryApiResponse = { items: SerializedJobDirectoryItem[]; nextCursor: string | null };
export type ActivityApiResponse = { events: SerializedPlatformEvent[]; nextCursor: string | null };

async function readErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const body = await res.json();
    if (body && typeof body.error === "string") return body.error;
  } catch {
    // response wasn't JSON — fall through to the generic message
  }
  return fallback;
}

export async function fetchUserDirectoryPage(
  params: {
    role?: Role;
    verified?: UserDirectoryVerifiedFilter;
    search?: string;
    cursor?: string | null;
    limit?: number;
  },
  signal?: AbortSignal
): Promise<UserDirectoryApiResponse> {
  const qs = new URLSearchParams();
  if (params.role) qs.set("role", params.role);
  if (params.verified) qs.set("verified", params.verified);
  if (params.search) qs.set("search", params.search);
  if (params.cursor) qs.set("cursor", params.cursor);
  qs.set("limit", String(params.limit ?? 25));

  const res = await fetch(`/api/admin/users?${qs.toString()}`, { cache: "no-store", signal });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Failed to load the user directory."));
  }
  return res.json();
}

export async function fetchJobDirectoryPage(
  params: { status?: JobStatus; search?: string; cursor?: string | null; limit?: number },
  signal?: AbortSignal
): Promise<JobDirectoryApiResponse> {
  const qs = new URLSearchParams();
  if (params.status) qs.set("status", params.status);
  if (params.search) qs.set("search", params.search);
  if (params.cursor) qs.set("cursor", params.cursor);
  qs.set("limit", String(params.limit ?? 25));

  const res = await fetch(`/api/admin/jobs/directory?${qs.toString()}`, { cache: "no-store", signal });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Failed to load the job directory."));
  }
  return res.json();
}

export async function fetchUserActivityPage(
  userId: string,
  params: { eventType?: PlatformEventType; cursor?: string | null; limit?: number },
  signal?: AbortSignal
): Promise<ActivityApiResponse> {
  const qs = new URLSearchParams();
  if (params.eventType) qs.set("eventType", params.eventType);
  if (params.cursor) qs.set("cursor", params.cursor);
  qs.set("limit", String(params.limit ?? 50));

  const res = await fetch(`/api/admin/users/${userId}/activity?${qs.toString()}`, { cache: "no-store", signal });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Failed to load the activity timeline."));
  }
  return res.json();
}

export type SupportActionResult =
  | { ok: true; result: SerializedUserSupportActionResult }
  | { ok: false; error: string };

export async function submitUserSupportAction(
  userId: string,
  action: UserSupportAction,
  note?: string
): Promise<SupportActionResult> {
  const res = await fetch(`/api/admin/users/${userId}/actions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, note }),
  });
  if (!res.ok) {
    return { ok: false, error: await readErrorMessage(res, "This action could not be completed.") };
  }
  const result = (await res.json()) as SerializedUserSupportActionResult;
  return { ok: true, result };
}
