/**
 * Client-side fetch helpers for the admin team screen. Talks only to
 * `/api/admin/team` and `/api/admin/team/[id]` (docs/ADMIN-CONSOLE-PLAN.md
 * §6.7/§8.1) — no business logic here, same rationale and same
 * per-directory-local `readErrorMessage` duplication as
 * components/admin/directory/api.ts and components/admin/queue/api.ts.
 */
import type { AdminLevel, AdminPermission } from "./types";

export type SerializedAdminTeamMember = {
  userId: string;
  email: string;
  level: AdminLevel;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
};

export type AdminTeamApiResult<T> = { ok: true; data: T } | { ok: false; status: number; error: string };

async function readErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const body = await res.json();
    if (body && typeof body.error === "string") return body.error;
  } catch {
    // response wasn't JSON — fall through to the generic message
  }
  return fallback;
}

export async function createAdminTeamProfile(input: {
  userId: string;
  level: AdminLevel;
  permissions?: AdminPermission[];
}): Promise<AdminTeamApiResult<SerializedAdminTeamMember>> {
  const res = await fetch("/api/admin/team", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    return { ok: false, status: res.status, error: await readErrorMessage(res, "Could not create the admin profile.") };
  }
  return { ok: true, data: await res.json() };
}

export async function updateAdminTeamProfile(
  targetUserId: string,
  input: { level?: AdminLevel; permissions?: AdminPermission[] }
): Promise<AdminTeamApiResult<SerializedAdminTeamMember>> {
  const res = await fetch(`/api/admin/team/${targetUserId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    return { ok: false, status: res.status, error: await readErrorMessage(res, "Could not update this admin.") };
  }
  return { ok: true, data: await res.json() };
}

export async function revokeAdminTeamProfile(targetUserId: string): Promise<AdminTeamApiResult<{ revoked: true }>> {
  const res = await fetch(`/api/admin/team/${targetUserId}`, { method: "DELETE" });
  if (!res.ok) {
    return { ok: false, status: res.status, error: await readErrorMessage(res, "Could not revoke this admin's profile.") };
  }
  return { ok: true, data: await res.json() };
}
