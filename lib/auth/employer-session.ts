import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/Auth";
import { getEmployerNavCountsCached } from "@/lib/employer-cache";
import { getCompanyPlan, type SubscriptionPlan } from "@/lib/subscriptions";
import { getEmployerCompanyByUserId } from "@/lib/auth/employer-company";
import { ensureEmployerCompany } from "@/lib/employer/companies";

export const getSession = cache(async () => auth());

export { getEmployerCompanyByUserId };

export const getEmployerPlanCached = cache(async (companyId: string): Promise<SubscriptionPlan> => {
  return getCompanyPlan(companyId);
});

export type EmployerLayoutContext = {
  session: NonNullable<Awaited<ReturnType<typeof getSession>>>;
  company: NonNullable<Awaited<ReturnType<typeof getEmployerCompanyByUserId>>>;
  navCounts: Awaited<ReturnType<typeof getEmployerNavCountsCached>>;
  plan: SubscriptionPlan;
};

export async function requireEmployerLayoutContext() {
  const session = await getSession();
  if (!session?.user || session.user.role !== "EMPLOYER") {
    return null;
  }

  let company = await getEmployerCompanyByUserId(session.user.id);
  if (!company) {
    company = await ensureEmployerCompany(session.user.id);
  }
  const navCounts = await getEmployerNavCountsCached(company.id);
  const plan = await getEmployerPlanCached(company.id);

  return { session, company, navCounts, plan };
}

/** Layout + pages: ensures employer is signed in and has a company row. */
export async function requireEmployerPageContext(): Promise<EmployerLayoutContext> {
  const ctx = await requireEmployerLayoutContext();
  if (!ctx) redirect("/login");
  return ctx;
}
