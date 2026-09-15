import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/Auth";
import { resolveSessionUserId } from "@/lib/auth/resolve-session-user";
import { resolveActiveImpersonation } from "@/lib/admin/impersonation";
import { recordPiiRead } from "@/lib/admin/audit";

export const getSession = cache(async () => auth());

type Session = NonNullable<Awaited<ReturnType<typeof getSession>>>;

/** Persistent-banner hook for the impersonation overlay (docs/ADMIN-CONSOLE-PLAN.md §8.2) — optional so the ~8 existing seeker pages that destructure only `{ userId }` / `{ session }` keep compiling unchanged. */
export type SeekerImpersonationBanner = {
  sessionId: string;
  targetDisplayName: string;
  expiresAt: Date;
};

export type SeekerPageContext = {
  session: Session;
  userId: string;
  impersonation?: SeekerImpersonationBanner;
};

/**
 * Resolves the seeker-surface "view as" overlay for an ADMIN's active
 * impersonation session, if any. This function re-asserts
 * `session.user.role === "ADMIN"` itself as its very first line — it does
 * not trust the caller to have already checked that — so a SEEKER or
 * EMPLOYER session can NEVER obtain an overlay even if this were ever
 * miscalled or the call site below were reordered. That is what makes "a
 * non-admin must never be able to obtain an overlay" structural rather than
 * a conditional someone could get wrong later.
 */
async function resolveSeekerOverlay(session: Session) {
  if (session.user.role !== "ADMIN") return null;

  const active = await resolveActiveImpersonation();
  if (!active) return null;
  // The cookie's session id must belong to THIS authenticated admin — not
  // merely "some admin" — in case a stale impersonation cookie survives a
  // browser profile being reused by a different admin login.
  if (active.adminUserId !== session.user.id) return null;
  if (active.target.role !== "SEEKER") return null;

  return active;
}

export async function requireSeekerLayoutContext(): Promise<SeekerPageContext | null> {
  const session = await getSession();
  if (!session?.user) return null;

  if (session.user.role === "ADMIN") {
    const overlay = await resolveSeekerOverlay(session);
    if (!overlay) return null;

    // §8.2: "every action inside the session audited." Fire-and-forget via
    // recordPiiRead — this is a read, not a decision (see recordPiiRead's
    // doc comment in lib/admin/audit.ts).
    recordPiiRead(overlay.adminUserId, "IMPERSONATED_PAGE_VIEW", "USER", overlay.target.id, {
      impersonationSessionId: overlay.sessionId,
    });

    return {
      session,
      userId: overlay.target.id,
      impersonation: {
        sessionId: overlay.sessionId,
        targetDisplayName: overlay.target.name,
        expiresAt: overlay.expiresAt,
      },
    };
  }

  if (session.user.role !== "SEEKER") {
    return null;
  }

  const userId = await resolveSessionUserId(session.user);
  if (!userId) redirect("/login");

  return { session, userId };
}

/** Layout + pages: ensures seeker is signed in. */
export async function requireSeekerPageContext(): Promise<SeekerPageContext> {
  const ctx = await requireSeekerLayoutContext();
  if (!ctx) redirect("/login");
  return ctx;
}
