/**
 * Client-side fetch helper for `/admin/audit` (docs/ADMIN-CONSOLE-PLAN.md
 * §4.9) — talks only to `GET /api/admin/audit`. No business logic lives
 * here, same rationale as components/admin/directory/api.ts.
 */
import type { AuditLogApiResponse, AuditLogFilters } from "./types";
import { readErrorMessage } from "@/components/admin/apiHelpers";

export async function fetchAuditLogPage(
  params: AuditLogFilters & { cursor?: string | null; limit?: number },
  signal?: AbortSignal
): Promise<AuditLogApiResponse> {
  const qs = new URLSearchParams();
  if (params.adminUserId) qs.set("adminUserId", params.adminUserId);
  if (params.targetType) qs.set("targetType", params.targetType);
  if (params.targetId) qs.set("targetId", params.targetId);
  if (params.action) qs.set("action", params.action);
  if (params.since) qs.set("since", params.since);
  if (params.until) qs.set("until", params.until);
  if (params.cursor) qs.set("cursor", params.cursor);
  qs.set("limit", String(params.limit ?? 50));

  const res = await fetch(`/api/admin/audit?${qs.toString()}`, { cache: "no-store", signal });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Failed to load the audit log."));
  }
  return res.json();
}
