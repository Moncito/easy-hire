import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/Auth";
import { prisma } from "@/lib/prisma";
import { getEmployerNavCountsCached } from "@/lib/employer-cache";
import { getCompanyPlan, type SubscriptionPlan } from "@/lib/subscriptions";

export const getSession = cache(async () => auth());

export const getEmployerCompanyByUserId = cache(async (userId: string) => {
  return prisma.company.findUnique({
    where: { userId },
  });
});

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

  const company = await getEmployerCompanyByUserId(session.user.id);
  const navCounts = company
    ? await getEmployerNavCountsCached(company.id)
    : { activeJobs: 0, needsReview: 0, unreadMessages: 0 };
  const plan = company ? await getEmployerPlanCached(company.id) : ("FREE" as SubscriptionPlan);

  return { session, company, navCounts, plan };
}

/** Layout + pages: ensures employer is signed in and has a company row. */
export async function requireEmployerPageContext(): Promise<EmployerLayoutContext> {
  const ctx = await requireEmployerLayoutContext();
  if (!ctx) redirect("/login");
  if (!ctx.company) redirect("/employer/company-profile");
  return ctx as EmployerLayoutContext;
}
