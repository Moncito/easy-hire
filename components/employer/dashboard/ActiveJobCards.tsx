import Link from "next/link";
import EmployerJobCard from "@/components/employer/EmployerJobCard";
import type { EmployerAnalytics } from "@/lib/employer-analytics";
import type { EmployerJobCardData } from "@/lib/employer-jobs";

type Props = {
  jobs: EmployerAnalytics["activeJobs"];
  companyVerified: boolean;
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

export default function ActiveJobCards({ jobs, companyVerified }: Props) {
  if (jobs.length === 0) {
    return (
      <div className="rounded-2xl border border-ink/5 bg-white p-10 text-center shadow-sm">
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

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {jobs.map((job) => (
        <EmployerJobCard
          key={job.id}
          job={toCardData(job)}
          companyVerified={companyVerified}
        />
      ))}
    </div>
  );
}
