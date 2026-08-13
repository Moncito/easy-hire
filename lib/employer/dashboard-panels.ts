import { prisma } from "@/lib/prisma";
import type { EmployerAnalytics } from "@/lib/employer-analytics";

export type DashboardApplicantItem = {
  id: string;
  seekerName: string;
  seekerPhotoUrl: string | null;
  jobId: string;
  jobTitle: string;
  status: string;
  appliedAt: string;
};

export type JobPerformanceRow = {
  id: string;
  title: string;
  views: number;
  applicants: number;
  conversion: number | null;
};

const STATUS_PRIORITY: Record<string, number> = {
  APPLIED: 0,
  SHORTLISTED: 1,
  INTERVIEW: 2,
  HIRED: 3,
  REJECTED: 4,
};

const STATUS_LABELS: Record<string, string> = {
  APPLIED: "Applied",
  SHORTLISTED: "Shortlisted",
  INTERVIEW: "Interview",
  HIRED: "Hired",
  REJECTED: "Rejected",
};

export function getApplicantStatusLabel(status: string) {
  return STATUS_LABELS[status] ?? status;
}

export async function getDashboardApplicantQueue(
  companyId: string,
  limit = 5
): Promise<DashboardApplicantItem[]> {
  const applications = await prisma.application.findMany({
    where: {
      job: { companyId, status: "ACTIVE" },
      status: { not: "REJECTED" },
    },
    orderBy: { appliedAt: "desc" },
    take: limit * 2,
    include: {
      seeker: { select: { fullName: true, photoUrl: true } },
      job: { select: { id: true, title: true } },
    },
  });

  return applications
    .sort((a, b) => {
      const priorityDiff =
        (STATUS_PRIORITY[a.status] ?? 99) - (STATUS_PRIORITY[b.status] ?? 99);
      if (priorityDiff !== 0) return priorityDiff;
      return b.appliedAt.getTime() - a.appliedAt.getTime();
    })
    .slice(0, limit)
    .map((app) => ({
      id: app.id,
      seekerName: app.seeker.fullName,
      seekerPhotoUrl: app.seeker.photoUrl,
      jobId: app.job.id,
      jobTitle: app.job.title,
      status: app.status,
      appliedAt: app.appliedAt.toISOString(),
    }));
}

export function getJobPerformanceRows(
  activeJobs: EmployerAnalytics["activeJobs"]
): JobPerformanceRow[] {
  return activeJobs
    .map((job) => ({
      id: job.id,
      title: job.title,
      views: job.viewCount,
      applicants: job.applicantCount,
      conversion:
        job.viewCount > 0
          ? Math.round((job.applicantCount / job.viewCount) * 100)
          : null,
    }))
    .sort((a, b) => b.applicants - a.applicants || b.views - a.views);
}

export function shouldShowApplicantQueue(totalApplicants: number) {
  return totalApplicants > 0;
}

export function shouldShowJobPerformance(activeJobCount: number) {
  return activeJobCount >= 2;
}
