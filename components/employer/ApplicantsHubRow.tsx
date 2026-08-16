import Link from "next/link";
import { ChevronRight } from "lucide-react";
import EmployerPipelineBar from "@/components/employer/ui/EmployerPipelineBar";
import type { EmployerJobCardData } from "@/lib/employer-jobs";
import { canViewPublicListing, formatJobSubtitle, jobStatusDisplay } from "@/lib/employer-jobs";

type Props = {
  job: EmployerJobCardData;
  companyVerified: boolean;
  index?: number;
  variant?: "free" | "pro";
};

function formatUpdated(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

const STAGES = [
  { key: "applied" as const, label: "Applied" },
  { key: "shortlisted" as const, label: "Shortlisted" },
  { key: "interview" as const, label: "Interview" },
  { key: "hired" as const, label: "Hired" },
];

export default function ApplicantsHubRow({
  job,
  companyVerified,
  index = 0,
  variant = "free",
}: Props) {
  const status = jobStatusDisplay(job, companyVerified);
  const stagger = Math.min(index, 5) * 40;
  const isPro = variant === "pro";
  const href = `/employer/jobs/${job.id}/applicants`;
  const shareable = canViewPublicListing(job, companyVerified);
  const nextLabel = job.unreviewedCount > 0 ? "Review" : job.applicantCount > 0 ? "Open pipeline" : "Open";

  if (isPro) {
    return (
      <article
        className="pro-card p-4 sm:p-5"
        style={{ animationDelay: `${stagger}ms` }}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={href}
                className="font-display text-base font-bold text-ink transition hover:text-[#9A5B12]"
              >
                {job.title}
              </Link>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${status.className}`}
              >
                {status.label}
              </span>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-ink/45">
              <span>{formatJobSubtitle(job)}</span>
              {job.unreviewedCount > 0 && (
                <span className="font-semibold text-amber-800">
                  {job.unreviewedCount} need review
                </span>
              )}
              <span className="font-data text-ink/35">Updated {formatUpdated(job.updatedAt)}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1 font-data text-xs text-ink/55 lg:justify-end">
            {STAGES.map((stage) => (
              <span key={stage.key}>
                {stage.label}{" "}
                <span className="font-bold text-ink">{job.pipeline[stage.key]}</span>
              </span>
            ))}
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <span className="font-data text-sm font-bold tabular-nums text-ink">
              {job.applicantCount}
              <span className="ml-1 font-sans text-xs font-medium text-ink/45">
                {job.applicantCount === 1 ? "applicant" : "applicants"}
              </span>
            </span>
            <Link
              href={href}
              className="inline-flex items-center gap-1 text-sm font-semibold text-[#9A5B12] hover:underline"
            >
              {nextLabel}
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>

        <div className="mt-3">
          <EmployerPipelineBar variant="pro" {...job.pipeline} />
        </div>

        {job.applicantCount === 0 && (
          <p className="mt-2 text-xs text-ink/45">
            No applicants yet
            {shareable ? (
              <>
                {" — "}
                <Link href={`/jobs/${job.id}`} className="font-semibold text-[#9A5B12] hover:underline">
                  share listing
                </Link>
              </>
            ) : null}
          </p>
        )}
      </article>
    );
  }

  return (
    <Link
      href={href}
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
