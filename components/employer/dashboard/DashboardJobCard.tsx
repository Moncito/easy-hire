import Link from "next/link";
import { Users } from "lucide-react";
import type { EmployerJobCardData } from "@/lib/employer-jobs";
import {
  jobStatusDisplay,
  formatJobSubtitle,
  getJobPrimaryAction,
  canViewPublicListing,
} from "@/lib/employer-jobs";
import EmployerPipelineBar from "@/components/employer/ui/EmployerPipelineBar";

type Props = {
  job: EmployerJobCardData;
  companyVerified: boolean;
};

function splitTitle(title: string) {
  const pipe = title.indexOf(" | ");
  if (pipe === -1) return { main: title, suffix: null as string | null };
  return { main: title.slice(0, pipe), suffix: title.slice(pipe + 3) };
}

export default function DashboardJobCard({ job, companyVerified }: Props) {
  const status = jobStatusDisplay(job, companyVerified);
  const primaryAction = getJobPrimaryAction(job, companyVerified);
  const showPublicLink = canViewPublicListing(job, companyVerified);
  const { main, suffix } = splitTitle(job.title);
  const hireProgress = Math.min(
    100,
    Math.round((job.hiredCount / Math.max(job.targetHireCount, 1)) * 100)
  );

  const pipelineTotal =
    job.pipeline.applied +
    job.pipeline.shortlisted +
    job.pipeline.interview +
    job.pipeline.hired;
  const pipeline =
    pipelineTotal === 0 && job.applicantCount > 0
      ? { applied: job.applicantCount, shortlisted: 0, interview: 0, hired: 0 }
      : job.pipeline;

  return (
    <div className="employer-ws-surface flex h-full min-h-[248px] flex-col rounded-2xl border p-4 transition hover:border-teal/20">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <Link
            href={primaryAction.href}
            className="line-clamp-2 font-display text-[15px] font-bold leading-snug text-ink transition-colors hover:text-teal"
            title={job.title}
          >
            {main}
          </Link>
          {suffix && (
            <p className="mt-0.5 line-clamp-1 text-[11px] font-medium text-ink/45">{suffix}</p>
          )}
          <p className="mt-1 line-clamp-1 text-[11px] text-ink/45">{formatJobSubtitle(job)}</p>
        </div>
        <span
          className={`shrink-0 rounded-full border px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider ${status.className}`}
        >
          {status.label}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="rounded-lg bg-ink/[0.04] px-2.5 py-1 text-[11px] text-ink/65">
          <span className="font-data font-bold text-ink">{job.applicantCount}</span> applicants
        </span>
        <span className="rounded-lg bg-ink/[0.04] px-2.5 py-1 text-[11px] text-ink/65">
          <span className="font-data font-bold text-ink">{job.viewCount}</span> views
        </span>
        {job.unreviewedCount > 0 && (
          <span className="rounded-lg bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-800">
            {job.unreviewedCount} to review
          </span>
        )}
      </div>

      <div className="mt-3 min-h-[72px] flex-1 space-y-2">
        <div className="flex items-center justify-between text-[10px] font-medium uppercase tracking-wider text-ink/40">
          <span>Pipeline</span>
          <span className="font-data normal-case tracking-normal text-ink/50">
            {job.applicantCount} in funnel
          </span>
        </div>
        <EmployerPipelineBar
          applied={pipeline.applied}
          shortlisted={pipeline.shortlisted}
          interview={pipeline.interview}
          hired={pipeline.hired}
        />
        <div className="flex items-center gap-2 pt-0.5">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-ink/5">
            <div
              className="h-full rounded-full bg-teal transition-all duration-500"
              style={{ width: `${Math.max(hireProgress, job.hiredCount > 0 ? 8 : 0)}%` }}
            />
          </div>
          <span className="shrink-0 font-data text-[10px] text-ink/45">
            {job.hiredCount}/{job.targetHireCount} hired
          </span>
        </div>
        {job.applicantCount === 0 && (
          <p className="text-[11px] leading-relaxed text-ink/45">
            No applicants yet —{" "}
            {showPublicLink ? (
              <Link href={`/jobs/${job.id}`} className="font-semibold text-teal hover:underline">
                share listing
              </Link>
            ) : (
              <Link href={`/employer/jobs/${job.id}/edit`} className="font-semibold text-teal hover:underline">
                polish listing
              </Link>
            )}
          </p>
        )}
      </div>

      <Link
        href={primaryAction.href}
        className={`mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold transition ${
          primaryAction.variant === "primary"
            ? "bg-teal text-white shadow-sm shadow-teal/20 hover:bg-teal/95"
            : "border border-ink/10 bg-ink/[0.02] text-ink/75 hover:bg-ink/5"
        }`}
      >
        <Users className="h-3.5 w-3.5" strokeWidth={2.25} />
        {primaryAction.label}
      </Link>
    </div>
  );
}
