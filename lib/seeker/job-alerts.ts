import { unstable_cache, revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-error";
import { ensureSeekerProfile } from "@/lib/seekers";
import { seekerJobAlertsTag } from "@/lib/seeker/cache-tags";
import { createJobAlertSchema, type CreateJobAlertInput } from "@/lib/validations/job-alert";

const JOB_ALERTS_REVALIDATE_SECONDS = 30;

/** Drop the cached job-alerts list for one seeker (call after create/delete). */
export function invalidateSeekerJobAlerts(userId: string) {
  revalidateTag(seekerJobAlertsTag(userId), "max");
}

export function listJobAlerts(userId: string) {
  return unstable_cache(
    async () => {
      const profile = await prisma.seekerProfile.findUnique({ where: { userId } });
      if (!profile) return [];

      const alerts = await prisma.jobAlert.findMany({
        where: { seekerId: profile.id },
        orderBy: { createdAt: "desc" },
      });

      return alerts.map((a) => ({
        id: a.id,
        keywords: a.keywords,
        category: a.category,
        frequency: a.frequency,
        createdAt: a.createdAt.toISOString(),
      }));
    },
    ["seeker-job-alerts", userId],
    { revalidate: JOB_ALERTS_REVALIDATE_SECONDS, tags: [seekerJobAlertsTag(userId)] }
  )();
}

export async function createJobAlert(userId: string, raw: unknown) {
  const input: CreateJobAlertInput = createJobAlertSchema.parse(raw);
  const profile = await ensureSeekerProfile(userId);

  const existing = await prisma.jobAlert.findFirst({
    where: { seekerId: profile.id, keywords: input.keywords },
  });
  if (existing) {
    throw new ApiError("You already have an alert for this search", 409);
  }

  const alertCount = await prisma.jobAlert.count({ where: { seekerId: profile.id } });
  if (alertCount >= 15) {
    throw new ApiError("You've reached the maximum number of job alerts (15)", 400);
  }

  const alert = await prisma.jobAlert.create({
    data: {
      seekerId: profile.id,
      keywords: input.keywords,
      category: input.category || null,
      frequency: input.frequency,
    },
  });
  invalidateSeekerJobAlerts(userId);

  return {
    id: alert.id,
    keywords: alert.keywords,
    category: alert.category,
    frequency: alert.frequency,
    createdAt: alert.createdAt.toISOString(),
  };
}

export async function deleteJobAlert(userId: string, alertId: string) {
  const profile = await prisma.seekerProfile.findUnique({ where: { userId } });
  if (!profile) throw new ApiError("Alert not found", 404);

  const alert = await prisma.jobAlert.findUnique({ where: { id: alertId } });
  if (!alert || alert.seekerId !== profile.id) {
    throw new ApiError("Alert not found", 404);
  }

  await prisma.jobAlert.delete({ where: { id: alertId } });
  invalidateSeekerJobAlerts(userId);
  return { ok: true };
}
