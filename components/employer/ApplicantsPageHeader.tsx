import Link from "next/link";
import type { EmployerJobsSummary } from "@/lib/employer-jobs";

type Props = {
  summary: EmployerJobsSummary;
  jobsWithApplicants: number;
};

export default function ApplicantsPageHeader({ summary, jobsWithApplicants }: Props) {
  return (
    <div className="mb-6">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Applicants</h1>
        <span className="font-data text-sm font-semibold text-ink/40">
          {summary.totalApplicants} total
        </span>
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink/50">
        <span>
          <span className="font-data font-semibold text-ink">{jobsWithApplicants}</span>{" "}
          {jobsWithApplicants === 1 ? "job" : "jobs"} with applicants
        </span>
        {summary.needsReviewApplicants > 0 && (
          <Link
            href="/employer/applicants?filter=NEEDS_REVIEW"
            className="font-semibold text-teal hover:underline"
          >
            {summary.needsReviewApplicants} need review
          </Link>
        )}
      </div>
      <p className="mt-2 max-w-xl text-sm text-ink/45">
        Open a job to review its pipeline. Bars show how applicants are distributed across stages.
      </p>
    </div>
  );
}
