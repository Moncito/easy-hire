"use client";

import Link from "next/link";
import {
  Pencil,
  Users,
  AlertTriangle,
  Copy,
  XCircle,
  ExternalLink,
  Clock,
} from "lucide-react";
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
  onDuplicate?: () => void;
  onClose?: () => void;
  loading?: boolean;
};

function SecondaryAction({
  href,
  onClick,
  icon: Icon,
  label,
  danger,
}: {
  href?: string;
  onClick?: () => void;
  icon: typeof Pencil;
  label: string;
  danger?: boolean;
}) {
  const className = `inline-flex items-center gap-1 text-[11px] font-semibold transition ${
    danger ? "text-ink/50 hover:text-ember" : "text-ink/55 hover:text-teal"
  }`;

  if (href) {
    const isExternal = href.startsWith("/jobs/");
    return (
      <Link
        href={href}
        className={className}
        {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        <Icon className="h-3 w-3" strokeWidth={2.25} />
        {label}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      <Icon className="h-3 w-3" strokeWidth={2.25} />
      {label}
    </button>
  );
}

export default function EmployerJobCard({
  job,
  companyVerified,
  onDuplicate,
  onClose,
  loading,
}: Props) {
  const status = jobStatusDisplay(job, companyVerified);
  const primaryAction = getJobPrimaryAction(job, companyVerified);
  const ResolvedPrimaryIcon =
    job.status === "DRAFT"
      ? Pencil
      : primaryAction.label === "View applicants" ||
          primaryAction.label === "Review applicants" ||
          primaryAction.label === "View archive"
        ? Users
        : Clock;

  const hireProgress = Math.min(
    100,
    Math.round((job.hiredCount / Math.max(job.targetHireCount, 1)) * 100)
  );
  const showPublicLink = canViewPublicListing(job, companyVerified);
  const canClose =
    onClose && job.status !== "CLOSED" && job.status !== "PENDING_REVIEW";

  const updatedLabel = new Date(job.updatedAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

  const secondaryActions: Array<{
    key: string;
    href?: string;
    onClick?: () => void;
    icon: typeof Pencil;
    label: string;
    danger?: boolean;
  }> = [];

  if (showPublicLink) {
    secondaryActions.push({
      key: "public",
      href: `/jobs/${job.id}`,
      icon: ExternalLink,
      label: "View listing",
    });
  }
  if (job.status !== "DRAFT") {
    secondaryActions.push({
      key: "edit",
      href: `/employer/jobs/${job.id}/edit`,
      icon: Pencil,
      label: "Edit",
    });
  }
  if (onDuplicate) {
    secondaryActions.push({
      key: "duplicate",
      onClick: onDuplicate,
      icon: Copy,
      label: "Duplicate",
    });
  }
  if (canClose) {
    secondaryActions.push({
      key: "close",
      onClick: onClose,
      icon: XCircle,
      label: "Close job",
      danger: true,
    });
  }

  return (
    <div
      className={`group relative flex flex-col rounded-2xl border border-ink/5 bg-white p-5 shadow-sm transition hover:border-ink/10 hover:shadow-md ${
        loading ? "pointer-events-none opacity-60" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <Link
            href={primaryAction.href}
            className="line-clamp-2 block font-display text-base font-bold text-ink transition-colors hover:text-teal"
          >
            {job.title}
          </Link>
          <p className="mt-1 text-xs leading-relaxed text-ink/50">{formatJobSubtitle(job)}</p>
        </div>
        <span
          className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${status.className}`}
        >
          {status.label}
        </span>
      </div>

      <div className="mt-4 flex gap-5 border-b border-ink/5 pb-4 text-xs">
        <div>
          <span className="font-data text-xl font-bold text-ink">{job.applicantCount}</span>
          <p className="mt-0.5 text-ink/40">Applicants</p>
        </div>
        <div className="border-l border-ink/8 pl-5">
          <span className="font-data text-xl font-bold text-ink">{job.viewCount}</span>
          <p className="mt-0.5 text-ink/40">Views</p>
        </div>
        {job.unreviewedCount > 0 && (
          <div className="border-l border-ink/8 pl-5">
            <span className="font-data text-xl font-bold text-amber-700">{job.unreviewedCount}</span>
            <p className="mt-0.5 text-ink/40">To review</p>
          </div>
        )}
      </div>

      {job.applicantCount > 0 && (
        <div className="mt-4">
          <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-ink/40">
            Pipeline
          </p>
          <EmployerPipelineBar
            applied={job.pipeline.applied}
            shortlisted={job.pipeline.shortlisted}
            interview={job.pipeline.interview}
            hired={job.pipeline.hired}
          />
        </div>
      )}

      <div className="mt-4">
        <div className="mb-1 flex justify-between text-[10px] font-medium text-ink/50">
          <span>Hiring progress</span>
          <span className="font-data">
            {job.hiredCount}/{job.targetHireCount} hired
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-ink/5">
          <div
            className="h-full rounded-full bg-teal transition-all duration-500"
            style={{ width: `${hireProgress}%` }}
          />
        </div>
      </div>

      {job.needsAttention && (
        <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-amber-500/8 px-2.5 py-2 text-[10px] font-medium text-amber-800">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          Unreviewed applicants waiting 3+ days
        </div>
      )}

      <div className="mt-auto pt-4">
        <Link
          href={primaryAction.href}
          className={`flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold transition ${
            primaryAction.variant === "primary"
              ? "bg-teal text-white shadow-sm shadow-teal/20 hover:bg-teal/95"
              : "border border-ink/10 bg-ink/[0.02] text-ink/75 hover:bg-ink/5"
          }`}
        >
          <ResolvedPrimaryIcon className="h-3.5 w-3.5" strokeWidth={2.25} />
          {primaryAction.label}
        </Link>

        {secondaryActions.length > 0 && (
          <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 px-0.5">
            {secondaryActions.map((action) => (
              <SecondaryAction
                key={action.key}
                href={action.href}
                onClick={action.onClick}
                icon={action.icon}
                label={action.label}
                danger={action.danger}
              />
            ))}
          </div>
        )}

        <p className="mt-2.5 text-[10px] text-ink/30">Updated {updatedLabel}</p>
      </div>

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-white/70">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-teal border-t-transparent" />
        </div>
      )}
    </div>
  );
}
