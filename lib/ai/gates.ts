import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";
import { requireEmployerCompany } from "@/lib/employer-auth";
import { isEmployerPro } from "@/lib/billing/subscriptions";

/**
 * Every Easy AI feature is Employer Pro only. This resolves the caller's
 * company and throws a clear 403 for Free employers instead of silently
 * degrading, so the UI can show a consistent upgrade prompt.
 */
export async function requireProCompanyForAi(userId: string) {
  const company = await requireEmployerCompany(userId);
  const pro = await isEmployerPro(company.id);

  if (!pro) {
    throw new ApiError("Easy AI is an Employer Pro feature. Upgrade to use it.", 403);
  }

  return company;
}

/** Same gate, but starting from a companyId (used by server-only callers like cron/digest). */
export async function assertCompanyIsPro(companyId: string) {
  const pro = await isEmployerPro(companyId);
  if (!pro) {
    throw new ApiError("Easy AI is an Employer Pro feature. Upgrade to use it.", 403);
  }
}

/** Confirms a job belongs to the caller's company — used by job-scoped AI features. */
export async function requireCompanyJobForAi(companyId: string, jobId: string) {
  const job = await prisma.job.findFirst({ where: { id: jobId, companyId } });
  if (!job) {
    throw new ApiError("Job not found", 404);
  }
  return job;
}
