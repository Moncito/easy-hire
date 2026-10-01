import { prisma } from "@/lib/prisma";
import { getActiveJobCount, FREE_ACTIVE_JOB_SOFT_CAP } from "@/lib/billing/entitlements";

/**
 * "Usage this period" on the billing page. Every number is a count of real
 * rows — there is no metering or invoicing yet (payments wait on business
 * registration), so this shows what the account is actually using rather
 * than anything it's been charged for.
 */

const USAGE_WINDOW_DAYS = 30;

export type BillingUsage = {
  /** Jobs live or awaiting review — the same count the Free soft cap checks. */
  activeJobs: number;
  freeActiveJobCap: number;
  /** Active hiring-team members, including the owner. Never below 1. */
  teamSeats: number;
  aiRuns: number;
  csvExports: number;
  windowDays: number;
};

export async function getBillingUsage(companyId: string): Promise<BillingUsage> {
  const since = new Date(Date.now() - USAGE_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const [activeJobs, members, aiRuns, csvExports] = await Promise.all([
    getActiveJobCount(companyId),
    prisma.companyMember.count({ where: { companyId, status: "ACTIVE" } }),
    prisma.aiUsageEvent.count({ where: { companyId, createdAt: { gte: since } } }),
    // Only the Pro applicant CSV. The same table also logs RA 10173 account
    // data exports, which every plan has and which aren't a Pro feature.
    prisma.exportAuditLog.count({ where: { companyId, kind: "applicants_csv", createdAt: { gte: since } } }),
  ]);
  return {
    activeJobs,
    freeActiveJobCap: FREE_ACTIVE_JOB_SOFT_CAP,
    // The owner's membership row is created lazily, so a company that never
    // opened its team still has one seat: the owner.
    teamSeats: Math.max(1, members),
    aiRuns,
    csvExports,
    windowDays: USAGE_WINDOW_DAYS,
  };
}
