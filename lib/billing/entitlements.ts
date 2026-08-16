import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";
import { getCompanyPlan, isEmployerPro } from "@/lib/billing/subscriptions";

/** Free employers may only have this many jobs live (ACTIVE or awaiting review) at once. */
export const FREE_ACTIVE_JOB_SOFT_CAP = 3;

/** Statuses that count against the soft cap — a job "occupies a slot" once submitted. */
const SOFT_CAP_STATUSES: Array<"PENDING_REVIEW" | "ACTIVE"> = ["PENDING_REVIEW", "ACTIVE"];

/** How long a featured placement lasts once set, in days. */
export const FEATURED_JOB_DURATION_DAYS = 30;

export async function getActiveJobCount(companyId: string): Promise<number> {
  return prisma.job.count({
    where: { companyId, status: { in: SOFT_CAP_STATUSES } },
  });
}

export type JobCapCheck = {
  allowed: boolean;
  plan: "FREE" | "PRO";
  activeJobCount: number;
  softCap: number;
  reason?: string;
};

/**
 * Pro companies always pass. Free companies may submit/activate a job only
 * while under the soft cap of jobs that are live or pending review.
 * `excludeJobId` lets re-submitting/re-activating an already-counted job
 * (e.g. re-opening after a CLOSED status) skip double-counting itself.
 */
export async function canCreateOrActivateJob(
  companyId: string,
  options: { excludeJobId?: string } = {}
): Promise<JobCapCheck> {
  const plan = await getCompanyPlan(companyId);

  if (plan === "PRO") {
    return { allowed: true, plan, activeJobCount: 0, softCap: FREE_ACTIVE_JOB_SOFT_CAP };
  }

  const activeJobCount = await prisma.job.count({
    where: {
      companyId,
      status: { in: SOFT_CAP_STATUSES },
      ...(options.excludeJobId ? { id: { not: options.excludeJobId } } : {}),
    },
  });

  const allowed = activeJobCount < FREE_ACTIVE_JOB_SOFT_CAP;

  return {
    allowed,
    plan,
    activeJobCount,
    softCap: FREE_ACTIVE_JOB_SOFT_CAP,
    reason: allowed
      ? undefined
      : `Free employers can have up to ${FREE_ACTIVE_JOB_SOFT_CAP} jobs live or pending review at a time. Close a job or upgrade to Employer Pro for unlimited active jobs.`,
  };
}

/** Throws a clear 402/403-style error when the Free soft-cap blocks a job create/submit/activate. */
export async function assertCanCreateOrActivateJob(
  companyId: string,
  options: { excludeJobId?: string } = {}
): Promise<void> {
  const check = await canCreateOrActivateJob(companyId, options);
  if (!check.allowed) {
    throw new ApiError(
      check.reason ?? "Job limit reached for the Free plan. Upgrade to Employer Pro to continue.",
      403
    );
  }
}

/** Featured placements are an Employer Pro perk — throws if the company is on Free. */
export async function assertCanFeatureJob(companyId: string): Promise<void> {
  const pro = await isEmployerPro(companyId);
  if (!pro) {
    throw new ApiError("Featured job listings are an Employer Pro feature. Upgrade to feature this job.", 403);
  }
}

export { canAutoPublishJob, getCompanyPlan, isEmployerPro } from "@/lib/billing/subscriptions";
