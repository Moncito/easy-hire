import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { ensureSeekerProfile } from "@/lib/seekers";
import { listJobAlerts } from "@/lib/job-alerts";
import {
  seekerApplicationsTag,
  seekerJobAlertsTag,
  seekerProfileTag,
  seekerSavedJobsTag,
} from "@/lib/seeker/cache-tags";
import { reviveDates } from "@/lib/cache-utils";

const DASHBOARD_REVALIDATE_SECONDS = 20;

export async function getSeekerDashboardProfile(userId: string, fullName: string) {
  // Ensures the profile row exists before the cached read below — cheap now
  // that ensureSeekerProfile's own lookup is cached (see lib/seeker/seekers.ts).
  await ensureSeekerProfile(userId, { fullName });

  const result = await unstable_cache(
    async () => {
      const profile = await prisma.seekerProfile.findUnique({
        where: { userId },
        include: {
          applications: {
            orderBy: { appliedAt: "desc" },
            include: {
              job: {
                select: {
                  id: true,
                  title: true,
                  company: { select: { companyName: true } },
                },
              },
            },
          },
          savedJobs: {
            orderBy: { savedAt: "desc" },
            take: 5,
            include: {
              job: {
                select: {
                  id: true,
                  title: true,
                  company: { select: { companyName: true } },
                },
              },
            },
          },
          conversations: {
            orderBy: { lastMessageAt: "desc" },
            take: 3,
            include: {
              company: { select: { companyName: true } },
              messages: {
                orderBy: { createdAt: "desc" },
                take: 1,
              },
            },
          },
        },
      });

      const jobAlerts = await listJobAlerts(userId);

      return { profile, jobAlerts };
    },
    ["seeker-dashboard", userId],
    {
      revalidate: DASHBOARD_REVALIDATE_SECONDS,
      tags: [
        seekerProfileTag(userId),
        seekerApplicationsTag(userId),
        seekerSavedJobsTag(userId),
        seekerJobAlertsTag(userId),
      ],
    }
  )();
  return reviveDates(result);
}
