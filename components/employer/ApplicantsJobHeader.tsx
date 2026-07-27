import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";

type JobSummary = {
  id: string;
  title: string;
  status: string;
  employmentType: string;
  remoteType: string;
  location: string;
  createdAt: string;
};

type PipelineCounts = {
  applied: number;
  shortlisted: number;
  interview: number;
  hired: number;
  rejected: number;
};

type Props = {
  job: JobSummary;
  totalApplicants: number;
  pipeline: PipelineCounts;
};

const statusStyles: Record<string, string> = {
  ACTIVE: "bg-teal/10 text-teal border-teal/20",
  DRAFT: "bg-ink/5 text-ink/60 border-ink/10",
  PENDING_REVIEW: "bg-marigold/10 text-[#8a5a10] border-marigold/20",
  CLOSED: "bg-ink/5 text-ink/50 border-ink/10",
};

function formatLabel(value: string) {
  return value.replace(/_/g, " ");
}

export default function ApplicantsJobHeader({ job, totalApplicants, pipeline }: Props) {
  const posted = new Date(job.createdAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="mb-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/employer/jobs"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-ink/50 transition-colors hover:text-teal"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to jobs
        </Link>
        <Link
          href={`/employer/jobs/${job.id}/edit`}
          className="inline-flex items-center gap-1.5 rounded-xl border border-ink/10 bg-white px-3.5 py-2 text-xs font-semibold text-ink/75 transition-colors hover:border-ink/20 hover:bg-ink/3"
        >
          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
          Edit job
        </Link>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              {job.title}
            </h1>
            <span
              className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                statusStyles[job.status] ?? statusStyles.DRAFT
              }`}
            >
              {formatLabel(job.status)}
            </span>
          </div>
          <p className="mt-1.5 text-sm text-ink/50">
            {formatLabel(job.employmentType)} · {formatLabel(job.remoteType)} · {job.location}
          </p>
          <p className="mt-1 text-xs text-ink/40">
            {totalApplicants} {totalApplicants === 1 ? "applicant" : "applicants"} · Posted {posted}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { label: "Applied", count: pipeline.applied, className: "border-marigold/20 bg-marigold/5 text-[#8a5a10]" },
          { label: "Shortlisted", count: pipeline.shortlisted, className: "border-navy/15 bg-navy/5 text-navy" },
          { label: "Interview", count: pipeline.interview, className: "border-teal/20 bg-teal/8 text-teal" },
          { label: "Hired", count: pipeline.hired, className: "border-teal/25 bg-teal/10 text-teal" },
        ].map((item) => (
          <span
            key={item.label}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-semibold ${item.className}`}
          >
            {item.label}
            <span className="font-data text-xs opacity-80">{item.count}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
