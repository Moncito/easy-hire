import type { User } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";
import { loadResolvedAdminAccess, assertPermission, type AdminPermission, type ResolvedAdminAccess } from "@/lib/admin/permissions";

export async function requireAdmin(userId: string | undefined) {
  if (!userId) {
    throw new ApiError("Unauthorized", 401);
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user || user.role !== "ADMIN") {
    throw new ApiError("Unauthorized", 401);
  }

  return user;
}

/**
 * EXTENDS `requireAdmin` above — never bypasses or replaces it
 * (docs/ADMIN-CONSOLE-PLAN.md §8.1: "extend requireAdminPageContext... do
 * not bypass it", the same principle applied here to requireAdmin). Route
 * handlers that need a specific permission (not just "is an admin") call
 * this instead of the bare `requireAdmin`; it still runs `requireAdmin`
 * first, then layers the RBAC check from lib/admin/permissions.ts on top.
 *
 * This is DEFENCE IN DEPTH, not the only gate — the /lib functions these
 * routes call into (reviewCompany, getQueueItemDetail,
 * performUserSupportAction, etc.) check the same permission themselves via
 * `requireAdminPermission`, per §8.1's "a missing route guard should not be
 * the only thing between a support admin and the revenue screen."
 */
export async function requireAdminWithPermission(
  userId: string | undefined,
  permission: AdminPermission
): Promise<{ user: User; access: ResolvedAdminAccess }> {
  const user = await requireAdmin(userId);
  const access = await loadResolvedAdminAccess(user.id);
  assertPermission(access, permission);
  return { user, access };
}
