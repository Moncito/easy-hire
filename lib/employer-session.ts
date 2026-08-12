import { cache } from "react";
import { auth } from "@/Auth";
import { prisma } from "@/lib/prisma";
import { getEmployerNavCounts } from "@/lib/employer-analytics";
import { getCompanyPlan, type SubscriptionPlan } from "@/lib/subscriptions";

export const getSession = cache(async () => auth());

export const getEmployerCompanyByUserId = cache(async (userId: string) => {
  return prisma.company.findUnique({
    where: { userId },
  });
});

export const getEmployerNavCountsCached = cache(async (companyId: string) => {
  return getEmployerNavCounts(companyId);
});

export const getEmployerPlanCached = cache(async (companyId: string): Promise<SubscriptionPlan> => {
  return getCompanyPlan(companyId);
});

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
