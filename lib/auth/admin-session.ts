import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/Auth";
import { loadResolvedAdminAccess, hasPermission, type AdminPermission, type ResolvedAdminAccess } from "@/lib/admin/permissions";

export const getSession = cache(async () => auth());

export type AdminPageContext = {
  session: NonNullable<Awaited<ReturnType<typeof getSession>>>;
  userId: string;
  /**
   * Resolved level/permissions (docs/ADMIN-CONSOLE-PLAN.md §6.7/§8.1) —
   * additive to `session`/`userId` above, so existing callers that only
   * destructure those two keep working unchanged. `access.isBootstrap` is
   * what the UI should read to warn "no admin-team configuration exists
   * yet" (§6.7's task note: "make the bootstrap state observable to
   * callers").
   */
  access: ResolvedAdminAccess;
};

/** `cache()`-scoped per request, same convention as `getSession` above — the layout and every page that also calls this within one request share one resolution instead of one query each. */
const getCachedAdminAccess = cache(async (userId: string) => loadResolvedAdminAccess(userId));

export async function requireAdminLayoutContext(): Promise<AdminPageContext | null> {
  const session = await getSession();
  if (!session?.user || session.user.role !== "ADMIN") {
    return null;
  }

  const access = await getCachedAdminAccess(session.user.id);

  return { session, userId: session.user.id, access };
}

/** Layout + pages: ensures admin is signed in. */
export async function requireAdminPageContext(): Promise<AdminPageContext> {
  const ctx = await requireAdminLayoutContext();
  if (!ctx) redirect("/login");
  return ctx;
}

/**
 * Pages: signed in as an admin AND holding `permission`.
 *
 * Server Components call `/lib` read functions directly for their first
 * paint, bypassing the `app/api/admin/*` handlers entirely — so gating only
 * the API routes leaves the server-rendered page as an open door to data the
 * API would refuse the same admin. That is exactly the hole
 * docs/ADMIN-CONSOLE-PLAN.md §8.1 names: "a missing route guard should not
 * be the only thing between a support admin and the revenue screen."
 *
 * Redirects rather than throwing: a 403 thrown from a Server Component
 * surfaces as a generic error boundary, and §5 asks for "an explicit 'no
 * permission' state rather than a 404".
 */
export async function requireAdminPagePermission(permission: AdminPermission): Promise<AdminPageContext> {
  const ctx = await requireAdminPageContext();
  if (!hasPermission(ctx.access, permission)) {
    redirect(`/admin/forbidden?permission=${encodeURIComponent(permission)}`);
  }
  return ctx;
}
