import { prisma } from "@/lib/prisma";
import { ensureSeekerProfile } from "@/lib/seekers";
import { listJobAlerts } from "@/lib/job-alerts";

export async function getSeekerDashboardProfile(userId: string, fullName: string) {
  await ensureSeekerProfile(userId, { fullName });

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
}
