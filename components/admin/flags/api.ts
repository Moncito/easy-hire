/**
 * Client-side fetch helpers for `/admin/system/flags`. Talks only to
 * `/api/admin/feature-flags` and `/api/admin/feature-flags/[key]`
 * (docs/ADMIN-CONSOLE-PLAN.md §4.10) — no business logic here, same rationale
 * and same per-directory-local `readErrorMessage` duplication as
 * `components/admin/team/api.ts`.
 */
import type { SerializedFeatureFlag } from "./types";

export type FeatureFlagApiResult<T> = { ok: true; data: T } | { ok: false; status: number; error: string };

async function readErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const body = await res.json();
    if (body && typeof body.error === "string") return body.error;
  } catch {
    // response wasn't JSON — fall through to the generic message
  }
  return fallback;
}

export type CreateFeatureFlagInput = {
  key: string;
  description: string;
  enabled: boolean;
  rolloutPercentage?: number | null;
};

export async function createFeatureFlag(input: CreateFeatureFlagInput): Promise<FeatureFlagApiResult<SerializedFeatureFlag>> {
  const res = await fetch("/api/admin/feature-flags", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    return { ok: false, status: res.status, error: await readErrorMessage(res, "Could not create the feature flag.") };
  }
  return { ok: true, data: await res.json() };
}

export type UpdateFeatureFlagInput = {
  description?: string;
  enabled?: boolean;
  rolloutPercentage?: number | null;
};

export async function updateFeatureFlag(
  key: string,
  input: UpdateFeatureFlagInput
): Promise<FeatureFlagApiResult<SerializedFeatureFlag>> {
  const res = await fetch(`/api/admin/feature-flags/${encodeURIComponent(key)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    return { ok: false, status: res.status, error: await readErrorMessage(res, "Could not update this feature flag.") };
  }
  return { ok: true, data: await res.json() };
}

export async function deleteFeatureFlag(key: string): Promise<FeatureFlagApiResult<{ deleted: true }>> {
  const res = await fetch(`/api/admin/feature-flags/${encodeURIComponent(key)}`, { method: "DELETE" });
  if (!res.ok) {
    return { ok: false, status: res.status, error: await readErrorMessage(res, "Could not delete this feature flag.") };
  }
  return { ok: true, data: await res.json() };
}
