"use client";

import Link from "next/link";
import { ArrowLeft, ExternalLink, Pencil } from "lucide-react";
import EmployerPipelineBar from "@/components/employer/ui/EmployerPipelineBar";
import ExportCsvLink from "@/components/employer/ui/ExportCsvLink";
import EasyAiBulkShortlistButton from "@/components/employer/EasyAiBulkShortlistButton";
import {
  formatJobSubtitle,
  jobStatusDisplay,
  canViewPublicListing,
} from "@/lib/employer-jobs";

export type ApplicantsJobSummary = {
  id: string;
  title: string;
  status: string;
  employmentType: string;
  remoteType: string;
  location: string;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryPeriod: string;
  createdAt: string;
  targetHireCount: number;
};

export type PipelineCounts = {
  applied: number;
  shortlisted: number;
  interview: number;
  hired: number;
  rejected: number;
};

const STAGE_NAV = [
  { key: "APPLIED", label: "Applied", countKey: "applied" as const, dotClass: "bg-ink/30" },
  { key: "SHORTLISTED", label: "Shortlisted", countKey: "shortlisted" as const, dotClass: "bg-navy/60" },
  { key: "INTERVIEW", label: "Interview", countKey: "interview" as const, dotClass: "bg-teal/70" },
  { key: "HIRED", label: "Hired", countKey: "hired" as const, dotClass: "bg-teal" },
];

type Props = {
  job: ApplicantsJobSummary;
  totalApplicants: number;
  pipeline: PipelineCounts;
  companyVerified: boolean;
  needsAttention?: boolean;
  activeStage?: string | null;
  onStageSelect?: (stage: string) => void;
  toolbar?: React.ReactNode;
};

export default function ApplicantsJobHeader({
  job,
  totalApplicants,
  pipeline,
  companyVerified,
  needsAttention = false,
  activeStage,
  onStageSelect,
  toolbar,
}: Props) {
  const posted = new Date(job.createdAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const status = jobStatusDisplay({ status: job.status, needsAttention }, companyVerified);
  const showPublicLink = canViewPublicListing(job, companyVerified);
  const hasApplicants = totalApplicants > 0;

  return (
    <div className="mb-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/employer/jobs"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-ink/50 transition-colors hover:text-teal"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to jobs
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <ExportCsvLink jobId={job.id} label="Export applicants" />
          <EasyAiBulkShortlistButton jobId={job.id} />
          {showPublicLink && (
            <Link
              href={`/jobs/${job.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-ink/10 bg-white px-3 py-2 text-xs font-semibold text-ink/70 transition-colors hover:border-ink/20 hover:text-teal"
            >
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              View listing
            </Link>
          )}
          <Link
            href={`/employer/jobs/${job.id}/edit`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-ink/10 bg-white px-3 py-2 text-xs font-semibold text-ink/75 transition-colors hover:border-ink/20 hover:bg-ink/3"
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
            Edit job
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-[1.65rem]">
              {job.title}
            </h1>
            <span
              className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${status.className}`}
            >
              {status.label}
            </span>
          </div>
          <p className="mt-1.5 text-sm text-ink/55">{formatJobSubtitle(job)}</p>
          <p className="mt-1 text-xs text-ink/40">
            <span className="font-data font-semibold text-ink/60">{totalApplicants}</span>{" "}
            {totalApplicants === 1 ? "applicant" : "applicants"}
            {" · "}
            Posted {posted}
            {hasApplicants && (
              <>
                {" · "}
                <span className="font-data font-semibold text-ink/60">
                  {pipeline.hired}/{job.targetHireCount}
                </span>{" "}
                hired
              </>
            )}
          </p>
        </div>

        {hasApplicants && (
          <div className="w-full shrink-0 lg:max-w-xs">
            <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-ink/40">
              Pipeline overview
            </p>
            <EmployerPipelineBar
              applied={pipeline.applied}
              shortlisted={pipeline.shortlisted}
              interview={pipeline.interview}
              hired={pipeline.hired}
            />
          </div>
        )}
      </div>

      {hasApplicants && onStageSelect && (
        <div className="flex flex-wrap gap-2">
          {STAGE_NAV.map((stage) => {
            const count = pipeline[stage.countKey];
            const isActive = activeStage === stage.key;
            return (
              <button
                key={stage.key}
                type="button"
                onClick={() => onStageSelect(stage.key)}
                className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-[11px] font-semibold transition ${
                  isActive
                    ? "border-teal/25 bg-teal/8 text-teal"
                    : "border-ink/8 bg-white text-ink/65 hover:border-ink/15 hover:bg-ink/[0.02]"
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${stage.dotClass}`} aria-hidden="true" />
                {stage.label}
                <span className="font-data text-xs opacity-80">{count}</span>
              </button>
            );
          })}
          {pipeline.rejected > 0 && (
            <button
              type="button"
              onClick={() => onStageSelect("REJECTED")}
              className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-[11px] font-semibold transition ${
                activeStage === "REJECTED"
                  ? "border-ink/20 bg-ink/5 text-ink/70"
                  : "border-ink/8 bg-white text-ink/50 hover:border-ink/15"
              }`}
            >
              Rejected
              <span className="font-data text-xs opacity-80">{pipeline.rejected}</span>
            </button>
          )}
        </div>
      )}

      {toolbar && <div className="border-t border-ink/5 pt-3">{toolbar}</div>}
    </div>
  );
}
