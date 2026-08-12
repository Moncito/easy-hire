import { prisma } from "@/lib/prisma";

export async function getAdminDashboardMetrics() {
  const startOfToday = new Date(new Date().setHours(0, 0, 0, 0));

  const [pendingJobs, pendingCompanies, publicLiveJobs, approvedToday] = await Promise.all([
    prisma.job.count({ where: { status: "PENDING_REVIEW" } }),
    prisma.company.count({ where: { verifiedStatus: "PENDING" } }),
    prisma.job.count({
      where: { status: "ACTIVE", company: { verifiedStatus: "APPROVED" } },
    }),
    prisma.job.count({
      where: {
        status: "ACTIVE",
        publishedAt: { gte: startOfToday },
        company: { verifiedStatus: "APPROVED" },
      },
    }),
  ]);

  return { pendingJobs, pendingCompanies, publicLiveJobs, approvedToday };
}
