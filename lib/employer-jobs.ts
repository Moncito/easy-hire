import { prisma } from "@/lib/prisma";
import type { AttentionItem } from "@/lib/employer-analytics";
import { formatPesoRange, type SalaryPeriod } from "@/lib/format";

export type EmployerJobCardData = {
  id: string;
  title: string;
  description: string;
  requirements: string | null;
  benefits: string | null;
  category: string;
  industry: string | null;
  status: string;
  employmentType: string;
  location: string;
  remoteType: string;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryPeriod: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  applicantCount: number;
  unreviewedCount: number;
  viewCount: number;
  hiredCount: number;
  targetHireCount: number;
  needsAttention: boolean;
  pipeline: { applied: number; shortlisted: number; interview: number; hired: number };
  screeningQuestions: Array<{ prompt: string; required: boolean }>;
};

export type JobPrimaryAction = {
  href: string;
  label: string;
  variant: "primary" | "secondary";
};

export type EmployerJobsSummary = {
  total: number;
  active: number;
  needsReviewApplicants: number;
  totalApplicants: number;
  pendingReviewJobs: number;
  noViewJobs: number;
};

const STALE_DAYS = 3;

function enrichJob(
  job: {
    id: string;
    title: string;
    description: string;
    requirements: string | null;
    benefits: string | null;
    category: string;
    industry: string | null;
    status: string;
    employmentType: string;
    location: string;
    remoteType: string;
    salaryMin: number | null;
    salaryMax: number | null;
    salaryPeriod: string;
    createdAt: Date;
    updatedAt: Date;
    publishedAt: Date | null;
    targetHireCount: number;
    _count: { applications: number };
    applications: Array<{ status: string; appliedAt: Date }>;
    screeningQuestions: Array<{ prompt: string; required: boolean }>;
  },
  viewCount: number,
  staleThreshold: Date
): EmployerJobCardData {
  const unreviewedCount = job.applications.filter((a) => a.status === "APPLIED").length;
  const hiredCount = job.applications.filter((a) => a.status === "HIRED").length;
  const shortlistedCount = job.applications.filter((a) => a.status === "SHORTLISTED").length;
  const interviewCount = job.applications.filter((a) => a.status === "INTERVIEW").length;
  const hasStale = job.applications.some(
    (a) => a.status === "APPLIED" && a.appliedAt < staleThreshold
  );

  return {
    id: job.id,
    title: job.title,
    description: job.description,
    requirements: job.requirements,
    benefits: job.benefits,
    category: job.category,
    industry: job.industry,
    status: job.status,
    employmentType: job.employmentType,
    location: job.location,
    remoteType: job.remoteType,
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax,
    salaryPeriod: job.salaryPeriod,
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString(),
    publishedAt: job.publishedAt?.toISOString() ?? null,
    applicantCount: job._count.applications,
    unreviewedCount,
    viewCount,
    hiredCount,
    targetHireCount: job.targetHireCount,
    needsAttention: job.status === "ACTIVE" && unreviewedCount > 0 && hasStale,
    pipeline: {
      applied: unreviewedCount,
      shortlisted: shortlistedCount,
      interview: interviewCount,
      hired: hiredCount,
    },
    screeningQuestions: job.screeningQuestions,
  };
}

const REMOTE_LABELS: Record<string, string> = {
  REMOTE: "Remote",
  ONSITE: "On-site",
  HYBRID: "Hybrid",
};

const EMPLOYMENT_LABELS: Record<string, string> = {
  FULL_TIME: "Full-time",
  PART_TIME: "Part-time",
  CONTRACT: "Contract",
};

export function formatJobSubtitle(
  job: Pick<
    EmployerJobCardData,
    "remoteType" | "location" | "employmentType" | "salaryMin" | "salaryMax" | "salaryPeriod"
  >
) {
  const remote = REMOTE_LABELS[job.remoteType] ?? job.remoteType;
  const employment = EMPLOYMENT_LABELS[job.employmentType] ?? job.employmentType.replace("_", " ");
  const salary = formatPesoRange(
    job.salaryMin,
    job.salaryMax,
    job.salaryPeriod as SalaryPeriod
  );
  const salaryPart = salary === "Not specified" ? null : salary;
  return [remote, job.location, employment, salaryPart].filter(Boolean).join(" · ");
}

export function getJobPrimaryAction(
  job: Pick<EmployerJobCardData, "id" | "status" | "unreviewedCount">,
  companyVerified: boolean
): JobPrimaryAction {
  if (job.status === "DRAFT") {
    return {
      href: `/employer/jobs/${job.id}/edit`,
      label: "Continue editing",
      variant: "primary",
    };
  }
  if (job.status === "PENDING_REVIEW") {
    return {
      href: `/employer/jobs/${job.id}/edit`,
      label: "View submission",
      variant: "secondary",
    };
  }
  if (job.status === "CLOSED") {
    return {
      href: `/employer/jobs/${job.id}/applicants`,
      label: "View archive",
      variant: "secondary",
    };
  }
  if (job.unreviewedCount > 0) {
    return {
      href: `/employer/jobs/${job.id}/applicants`,
      label: "Review applicants",
      variant: "primary",
    };
  }
  if (job.status === "ACTIVE" && companyVerified) {
    return {
      href: `/employer/jobs/${job.id}/applicants`,
      label: "View applicants",
      variant: "primary",
    };
  }
  return {
    href: `/employer/jobs/${job.id}/applicants`,
    label: "View applicants",
    variant: "primary",
  };
}

export function canViewPublicListing(
  job: Pick<EmployerJobCardData, "status">,
  companyVerified: boolean
) {
  return job.status === "ACTIVE" && companyVerified;
}

export async function getEmployerJobsWithMetrics(companyId: string) {
  const now = new Date();
  const staleThreshold = new Date(now.getTime() - STALE_DAYS * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [jobs, jobViewCounts, needsReviewApplicants] = await Promise.all([
    prisma.job.findMany({
      where: { companyId },
      orderBy: { updatedAt: "desc" },
      include: {
        _count: { select: { applications: true } },
        applications: { select: { status: true, appliedAt: true } },
        screeningQuestions: {
          orderBy: { sortOrder: "asc" },
          select: { prompt: true, required: true },
        },
      },
    }),
    prisma.jobView.groupBy({
      by: ["jobId"],
      where: { job: { companyId } },
      _count: { _all: true },
    }),
    prisma.application.count({
      where: { job: { companyId }, status: "APPLIED" },
    }),
  ]);

  const viewCountByJob = Object.fromEntries(
    jobViewCounts.map((v) => [v.jobId, v._count._all])
  );

  const enriched = jobs.map((job) =>
    enrichJob(job, viewCountByJob[job.id] ?? 0, staleThreshold)
  );

  const summary: EmployerJobsSummary = {
    total: enriched.length,
    active: enriched.filter((j) => j.status === "ACTIVE").length,
    needsReviewApplicants: needsReviewApplicants,
    totalApplicants: enriched.reduce((s, j) => s + j.applicantCount, 0),
    pendingReviewJobs: enriched.filter((j) => j.status === "PENDING_REVIEW").length,
    noViewJobs: enriched.filter(
      (j) =>
        j.status === "ACTIVE" &&
        j.viewCount === 0 &&
        new Date(j.publishedAt ?? j.createdAt) < sevenDaysAgo
    ).length,
  };

  return { jobs: enriched, summary };
}

export function getJobsPageAttentionItems(summary: EmployerJobsSummary): AttentionItem[] {
  const items: AttentionItem[] = [];

  if (summary.needsReviewApplicants > 0) {
    items.push({
      id: "needs-review",
      label: `${summary.needsReviewApplicants} applicant${summary.needsReviewApplicants === 1 ? "" : "s"} need review`,
      href: "/employer/applicants?filter=NEEDS_REVIEW",
      priority: "high",
    });
  }
  if (summary.pendingReviewJobs > 0) {
    items.push({
      id: "pending-review",
      label: `${summary.pendingReviewJobs} job${summary.pendingReviewJobs === 1 ? "" : "s"} pending admin review`,
      href: "/employer/jobs?filter=PENDING_REVIEW",
      priority: "normal",
    });
  }
  if (summary.noViewJobs > 0) {
    items.push({
      id: "no-views",
      label: `${summary.noViewJobs} job${summary.noViewJobs === 1 ? "" : "s"} with no views yet`,
      href: "/employer/jobs?filter=ACTIVE",
      priority: "normal",
    });
  }

  return items;
}

export function getApplicantsPageAttentionItems(
  jobs: EmployerJobCardData[]
): AttentionItem[] {
  const staleJobs = jobs.filter((j) => j.needsAttention);
  if (staleJobs.length === 0) return [];

  return [
    {
      id: "stale-review",
      label: `${staleJobs.length} job${staleJobs.length === 1 ? "" : "s"} with applicants waiting 3+ days`,
      href: "/employer/applicants?filter=NEEDS_REVIEW",
      priority: "high",
    },
  ];
}

export function jobStatusDisplay(
  job: Pick<EmployerJobCardData, "status" | "needsAttention">,
  companyVerified: boolean
) {
  if (job.needsAttention) {
    return { label: "Needs attention", className: "bg-amber-500/15 text-amber-700 border-amber-500/20" };
  }
  if (job.status === "ACTIVE" && companyVerified) {
    return { label: "Actively hiring", className: "bg-teal/10 text-teal border-teal/15" };
  }
  if (job.status === "ACTIVE" && !companyVerified) {
    return { label: "Approved — not public", className: "bg-navy/10 text-navy border-navy/15" };
  }
  if (job.status === "PENDING_REVIEW") {
    return { label: "Pending review", className: "bg-navy/10 text-navy border-navy/15" };
  }
  if (job.status === "DRAFT") {
    return { label: "Draft", className: "bg-ink/5 text-ink/55 border-ink/10" };
  }
  if (job.status === "CLOSED") {
    return { label: "Closed", className: "bg-ink/5 text-ink/45 border-ink/10" };
  }
  return {
    label: job.status.replace("_", " "),
    className: "bg-ink/5 text-ink/55 border-ink/10",
  };
}
