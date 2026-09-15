/**
 * Client-side fetch helper for `/admin/trust` (docs/ADMIN-CONSOLE-PLAN.md
 * §4.8) — talks only to `GET /api/admin/trust`. No business logic lives
 * here, same rationale as components/admin/directory/api.ts.
 */
import type { SerializedTrustDirectoryResult, TrustDirectoryTargetType } from "./types";
import { readErrorMessage } from "@/components/admin/apiHelpers";

export async function fetchTrustDirectoryPage(
  params: { type: TrustDirectoryTargetType; cursor?: string | null; limit?: number },
  signal?: AbortSignal
): Promise<SerializedTrustDirectoryResult> {
  const qs = new URLSearchParams();
  qs.set("type", params.type);
  if (params.cursor) qs.set("cursor", params.cursor);
  qs.set("limit", String(params.limit ?? 25));

  const res = await fetch(`/api/admin/trust?${qs.toString()}`, { cache: "no-store", signal });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Failed to load the trust directory."));
  }
  return res.json();
}
