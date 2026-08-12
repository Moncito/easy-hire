import { prisma } from "@/lib/prisma";

export type SubscriptionPlan = "FREE" | "PRO";

const JOB_LISTING_DAYS = 90;

export async function getCompanyPlan(companyId: string): Promise<SubscriptionPlan> {
  const active = await prisma.subscription.findFirst({
    where: { companyId, status: "ACTIVE", planType: "PRO" },
    select: { id: true },
  });
  return active ? "PRO" : "FREE";
}

export async function isEmployerPro(companyId: string): Promise<boolean> {
  return (await getCompanyPlan(companyId)) === "PRO";
}

/** Pro employers with an approved company can publish without admin job review. */
export async function canAutoPublishJob(companyId: string): Promise<boolean> {
  const [plan, company] = await Promise.all([
    getCompanyPlan(companyId),
    prisma.company.findUnique({
      where: { id: companyId },
      select: { verifiedStatus: true },
    }),
  ]);

  return plan === "PRO" && company?.verifiedStatus === "APPROVED";
}

export async function publishJobLive(jobId: string) {
  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setDate(expiresAt.getDate() + JOB_LISTING_DAYS);

  return prisma.job.update({
    where: { id: jobId },
    data: {
      status: "ACTIVE",
      publishedAt: now,
      expiresAt,
      reviewRejectionReason: null,
    },
  });
}

export async function getCompanySubscription(companyId: string) {
  return prisma.subscription.findFirst({
    where: { companyId },
    orderBy: { createdAt: "desc" },
  });
}
