import { prisma } from "@/lib/prisma";
import { invalidateEmployerWorkspace } from "@/lib/employer-cache";

export type SubscriptionPlan = "FREE" | "PRO";

const JOB_LISTING_DAYS = 90;

/** How many days a PAST_DUE Pro subscription still counts as PRO after its currentPeriodEnd. */
export const PAST_DUE_GRACE_DAYS = 14;

/**
 * Pure so this is unit-testable without touching Prisma. A failed card
 * shouldn't instantly revoke a paid workspace mid-hire, so PAST_DUE gets a
 * short grace window after the period it already paid for ends. With no
 * `currentPeriodEnd` to measure from, there's nothing to be lenient about.
 */
export function isWithinPastDueGrace(currentPeriodEnd: Date | null, now: Date): boolean {
  if (!currentPeriodEnd) return false;
  const graceEnd = new Date(currentPeriodEnd);
  graceEnd.setDate(graceEnd.getDate() + PAST_DUE_GRACE_DAYS);
  return now <= graceEnd;
}

export async function getCompanyPlan(companyId: string): Promise<SubscriptionPlan> {
  const subscriptions = await prisma.subscription.findMany({
    where: { companyId, planType: "PRO", status: { in: ["ACTIVE", "PAST_DUE"] } },
    select: { status: true, currentPeriodEnd: true },
  });

  const now = new Date();
  const isPro = subscriptions.some(
    (sub) =>
      sub.status === "ACTIVE" ||
      (sub.status === "PAST_DUE" && isWithinPastDueGrace(sub.currentPeriodEnd, now))
  );

  return isPro ? "PRO" : "FREE";
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

  const updated = await prisma.job.update({
    where: { id: jobId },
    data: {
      status: "ACTIVE",
      publishedAt: now,
      expiresAt,
      reviewRejectionReason: null,
    },
    select: { companyId: true },
  });

  invalidateEmployerWorkspace(updated.companyId);
  return prisma.job.findUniqueOrThrow({ where: { id: jobId } });
}

export async function getCompanySubscription(companyId: string) {
  return prisma.subscription.findFirst({
    where: { companyId },
    orderBy: { createdAt: "desc" },
  });
}
