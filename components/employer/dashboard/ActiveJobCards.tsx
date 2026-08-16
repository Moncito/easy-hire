import Link from "next/link";
import DashboardJobCard from "@/components/employer/dashboard/DashboardJobCard";
import ActiveJobsRail from "@/components/employer/dashboard/ActiveJobsRail";
import PostAnotherJobCard from "@/components/employer/dashboard/PostAnotherJobCard";
import type { EmployerAnalytics } from "@/lib/employer-analytics";
import type { EmployerJobCardData } from "@/lib/employer-jobs";

type Props = {
  jobs: EmployerAnalytics["activeJobs"];
  companyVerified: boolean;
  showPostAnother?: boolean;
};

function toCardData(job: EmployerAnalytics["activeJobs"][number]): EmployerJobCardData {
  return {
    id: job.id,
    title: job.title,
    description: "",
    requirements: null,
    benefits: null,
    category: "",
    industry: null,
    status: job.status,
    employmentType: "FULL_TIME",
    location: job.location,
    remoteType: job.remoteType,
    salaryMin: null,
    salaryMax: null,
    salaryPeriod: "MONTHLY",
    createdAt: job.updatedAt,
    updatedAt: job.updatedAt,
    publishedAt: null,
    featuredUntil: null,
    reviewRejectionReason: null,
    applicantCount: job.applicantCount,
    unreviewedCount: 0,
    viewCount: job.viewCount,
    hiredCount: job.hiredCount,
    targetHireCount: job.targetHireCount,
    needsAttention: job.needsAttention,
    pipeline: { applied: 0, shortlisted: 0, interview: 0, hired: job.hiredCount },
    screeningQuestions: [],
  };
}

function getGridClass(totalSlots: number) {
  if (totalSlots <= 1) return "grid grid-cols-1 gap-4";
  if (totalSlots === 2) return "grid grid-cols-1 gap-4 sm:grid-cols-2";
  return "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3";
}

function JobCardSlot({ job, companyVerified }: { job: EmployerAnalytics["activeJobs"][number]; companyVerified: boolean }) {
  return (
    <div className="h-full min-w-0 sm:min-w-[300px] lg:min-w-0">
      <DashboardJobCard job={toCardData(job)} companyVerified={companyVerified} />
    </div>
  );
}

export default function ActiveJobCards({ jobs, companyVerified, showPostAnother = false }: Props) {
  if (jobs.length === 0) {
    return (
      <div className="rounded-2xl border border-navy/[0.08] bg-white/95 p-10 text-center shadow-sm">
        <p className="text-sm font-semibold text-ink">No active jobs</p>
        <p className="mt-1 text-xs text-ink/50">Post a job to start receiving applications.</p>
        <Link
          href="/employer/jobs/new"
          className="mt-4 inline-block rounded-xl bg-teal px-4 py-2 text-xs font-semibold text-white"
        >
          Post a job
        </Link>
      </div>
    );
  }

  const totalSlots = jobs.length + (showPostAnother ? 1 : 0);
  const useScrollRail = totalSlots >= 4;

  if (useScrollRail) {
    return (
      <ActiveJobsRail>
        {jobs.map((job) => (
          <div key={job.id} className="w-[min(100%,340px)] shrink-0 snap-start">
            <DashboardJobCard job={toCardData(job)} companyVerified={companyVerified} />
          </div>
        ))}
        {showPostAnother && (
          <div className="w-[min(100%,280px)] shrink-0 snap-start">
            <PostAnotherJobCard />
          </div>
        )}
      </ActiveJobsRail>
    );
  }

  return (
    <div className={`${getGridClass(totalSlots)} items-stretch`}>
      {jobs.map((job) => (
        <JobCardSlot key={job.id} job={job} companyVerified={companyVerified} />
      ))}
      {showPostAnother && (
        <div className="h-full min-h-[248px]">
          <PostAnotherJobCard />
        </div>
      )}
    </div>
  );
}
