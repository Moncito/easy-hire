import Link from "next/link";
import { ChevronRight } from "lucide-react";
import EmployerPipelineBar from "@/components/employer/ui/EmployerPipelineBar";
import type { EmployerJobCardData } from "@/lib/employer-jobs";
import { formatJobSubtitle, jobStatusDisplay } from "@/lib/employer-jobs";

type Props = {
  job: EmployerJobCardData;
  companyVerified: boolean;
  index?: number;
};

function formatUpdated(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function ApplicantsHubRow({ job, companyVerified, index = 0 }: Props) {
  const status = jobStatusDisplay(job, companyVerified);
  const stagger = Math.min(index, 5) * 40;

  return (
    <Link
      href={`/employer/jobs/${job.id}/applicants`}
      className="employer-page-enter group flex flex-col gap-3 border-b border-ink/5 border-l-2 border-l-transparent px-2 py-4 transition hover:border-l-teal hover:bg-ink/[0.03] focus-visible:border-l-teal focus-visible:bg-ink/[0.03] focus-visible:outline-none sm:flex-row sm:items-center sm:gap-4"
      style={{ animationDelay: `${stagger}ms` }}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-ink transition group-hover:text-teal">{job.title}</span>
          <span
            className={`rounded-md border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${status.className}`}
          >
            {status.label}
          </span>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-ink/45">
          <span>{formatJobSubtitle(job)}</span>
          {job.unreviewedCount > 0 && (
            <span className="font-semibold text-amber-700">
              {job.unreviewedCount} need review
            </span>
          )}
          <span className="font-data text-ink/35">Updated {formatUpdated(job.updatedAt)}</span>
        </div>
        <div className="mt-2.5 max-w-xs sm:hidden">
          <EmployerPipelineBar {...job.pipeline} />
        </div>
      </div>

      <div className="hidden shrink-0 text-right sm:block">
        <span className="font-data text-sm font-semibold tabular-nums text-ink">
          {job.applicantCount}
        </span>
        <span className="ml-1 text-xs text-ink/45">
          {job.applicantCount === 1 ? "applicant" : "applicants"}
        </span>
      </div>

      <div className="hidden w-32 shrink-0 md:block">
        <EmployerPipelineBar {...job.pipeline} />
      </div>

      <div className="flex items-center justify-between sm:contents">
        <span className="font-data text-sm font-semibold tabular-nums text-ink sm:hidden">
          {job.applicantCount}{" "}
          <span className="font-normal text-ink/45">
            {job.applicantCount === 1 ? "applicant" : "applicants"}
          </span>
        </span>
        <ChevronRight className="h-4 w-4 shrink-0 text-ink/25 transition group-hover:translate-x-0.5 group-hover:text-teal" />
      </div>
    </Link>
  );
}
