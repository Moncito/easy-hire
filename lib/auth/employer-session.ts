import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/Auth";
import { getEmployerNavCountsCached } from "@/lib/employer-cache";
import { getCompanyPlan, type SubscriptionPlan } from "@/lib/billing/subscriptions";
import { getEmployerCompanyByUserId } from "@/lib/auth/employer-company";
import { ensureEmployerCompany } from "@/lib/employer/companies";
import { isCollaborativeHiringEnabled } from "@/lib/collaborative-hiring";
import { resolveActiveImpersonation } from "@/lib/admin/impersonation";
import { recordPiiRead } from "@/lib/admin/audit";

export const getSession = cache(async () => auth());

type Session = NonNullable<Awaited<ReturnType<typeof getSession>>>;

export { getEmployerCompanyByUserId };

export const getEmployerPlanCached = cache(async (companyId: string): Promise<SubscriptionPlan> => {
  return getCompanyPlan(companyId);
});

/** Persistent-banner hook for the impersonation overlay (docs/ADMIN-CONSOLE-PLAN.md §8.2) — optional so the ~17 existing employer pages that destructure only `{ company }` / `{ plan }` keep compiling unchanged. */
export type EmployerImpersonationBanner = {
  sessionId: string;
  targetDisplayName: string;
  expiresAt: Date;
};

export type EmployerLayoutContext = {
  session: Session;
  company: NonNullable<Awaited<ReturnType<typeof getEmployerCompanyByUserId>>>;
  navCounts: Awaited<ReturnType<typeof getEmployerNavCountsCached>>;
  plan: SubscriptionPlan;
  collaborativeHiringEnabled: boolean;
  impersonation?: EmployerImpersonationBanner;
};

/**
 * Resolves the employer-surface "view as" overlay for an ADMIN's active
 * impersonation session, if any. Same structural guarantee as
 * `resolveSeekerOverlay` in lib/auth/seeker-session.ts: this function itself
 * re-checks `session.user.role === "ADMIN"` first, rather than trusting the
 * caller, so a non-admin session can never obtain an overlay regardless of
 * how the call site below is arranged.
 */
async function resolveEmployerOverlay(session: Session) {
  if (session.user.role !== "ADMIN") return null;

  const active = await resolveActiveImpersonation();
  if (!active) return null;
  if (active.adminUserId !== session.user.id) return null;
  if (active.target.role !== "EMPLOYER") return null;

  return active;
}

export async function requireEmployerLayoutContext(): Promise<EmployerLayoutContext | null> {
  const session = await getSession();
  if (!session?.user) return null;

  if (session.user.role === "ADMIN") {
    const overlay = await resolveEmployerOverlay(session);
    if (!overlay) return null;

    // Read-only overlay — never create a company on the impersonated
    // employer's behalf. `ensureEmployerCompany` is a write path meant for
    // the employer's own first sign-in; if no company exists yet there is
    // nothing legitimate to show, so the overlay simply has no context.
    const company = await getEmployerCompanyByUserId(overlay.target.id);
    if (!company) return null;

    // §8.2: "every action inside the session audited."
    recordPiiRead(overlay.adminUserId, "IMPERSONATED_PAGE_VIEW", "COMPANY", company.id, {
      impersonationSessionId: overlay.sessionId,
    });

    const [navCounts, plan, collaborativeHiringEnabled] = await Promise.all([
      getEmployerNavCountsCached(company.id),
      getEmployerPlanCached(company.id),
      isCollaborativeHiringEnabled(company.id),
    ]);

    return {
      session,
      company,
      navCounts,
      plan,
      collaborativeHiringEnabled,
      impersonation: {
        sessionId: overlay.sessionId,
        targetDisplayName: overlay.target.name,
        expiresAt: overlay.expiresAt,
      },
    };
  }

  if (session.user.role !== "EMPLOYER") {
    return null;
  }

  let company = await getEmployerCompanyByUserId(session.user.id);
  if (!company) {
    company = await ensureEmployerCompany(session.user.id);
  }
  const [navCounts, plan, collaborativeHiringEnabled] = await Promise.all([
    getEmployerNavCountsCached(company.id),
    getEmployerPlanCached(company.id),
    isCollaborativeHiringEnabled(company.id),
  ]);

  return { session, company, navCounts, plan, collaborativeHiringEnabled };
}

/** Layout + pages: ensures employer is signed in and has a company row. */
export async function requireEmployerPageContext(): Promise<EmployerLayoutContext> {
  const ctx = await requireEmployerLayoutContext();
  if (!ctx) redirect("/login");
  return ctx;
}
