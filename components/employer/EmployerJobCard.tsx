"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Pencil,
  Users,
  AlertTriangle,
  Copy,
  XCircle,
  Trash2,
  ExternalLink,
  Clock,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import type { EmployerJobCardData } from "@/lib/employer-jobs";
import {
  jobStatusDisplay,
  formatJobSubtitle,
  getJobPrimaryAction,
  canViewPublicListing,
} from "@/lib/employer-jobs";
import EmployerPipelineBar from "@/components/employer/ui/EmployerPipelineBar";
import { useEmployerShell } from "@/components/employer/EmployerShellContext";
import { fetchJsonSafe } from "@/lib/client/fetch-json";
import { callEasyAi } from "@/components/employer/pro/useEasyAi";
import ProButton from "@/components/employer/pro/ProButton";

type Props = {
  job: EmployerJobCardData;
  companyVerified: boolean;
  onDuplicate?: () => void;
  onClose?: () => void;
  onDelete?: () => void;
  loading?: boolean;
};

function SecondaryAction({
  href,
  onClick,
  icon: Icon,
  label,
  danger,
  isPro,
}: {
  href?: string;
  onClick?: () => void;
  icon: typeof Pencil;
  label: string;
  danger?: boolean;
  isPro?: boolean;
}) {
  const className = `inline-flex cursor-pointer items-center gap-1 text-[11px] font-semibold transition ${
    danger
      ? "text-ink/50 hover:text-ember"
      : isPro
        ? "text-ink/55 hover:text-[#9A5B12]"
        : "text-ink/55 hover:text-teal"
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
  onDelete,
  loading,
}: Props) {
  const { isPro } = useEmployerShell();
  const initiallyFeatured =
    Boolean(job.featuredUntil) && new Date(job.featuredUntil as string).getTime() > Date.now();
  const [featured, setFeatured] = useState(initiallyFeatured);
  const [featureLoading, setFeatureLoading] = useState(false);
  const [tips, setTips] = useState<string[] | null>(null);
  const [tipsLoading, setTipsLoading] = useState(false);
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
    onClose && job.status === "ACTIVE";
  const canDelete = onDelete && job.status === "DRAFT";
  const canFeature = isPro && job.status === "ACTIVE";

  async function handleToggleFeatured() {
    if (featureLoading) return;
    setFeatureLoading(true);
    const method = featured ? "DELETE" : "POST";
    const result = await fetchJsonSafe(`/api/jobs/${job.id}/feature`, { method });
    if (result.ok) {
      setFeatured(!featured);
      toast.success(featured ? "Removed from featured placement" : "Job featured for 30 days");
    } else {
      toast.error(result.error ?? "Could not update featured status");
    }
    setFeatureLoading(false);
  }

  async function handleJobTips() {
    if (tipsLoading) return;
    setTipsLoading(true);
    const result = await callEasyAi<{ tips: string[] }>("job-tips", { jobId: job.id });
    if (result?.configured && result.data?.tips) {
      setTips(result.data.tips);
    }
    setTipsLoading(false);
  }

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
  if (canFeature) {
    secondaryActions.push({
      key: "feature",
      onClick: handleToggleFeatured,
      icon: Star,
      label: featureLoading ? "Updating…" : featured ? "Remove featured" : "Feature job",
    });
  }
  if (isPro && (job.status === "ACTIVE" || job.status === "CLOSED")) {
    secondaryActions.push({
      key: "tips",
      onClick: handleJobTips,
      icon: AlertTriangle,
      label: tipsLoading ? "Analyzing…" : "Easy AI tips",
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
  if (canDelete) {
    secondaryActions.push({
      key: "delete",
      onClick: onDelete,
      icon: Trash2,
      label: "Delete draft",
      danger: true,
    });
  }

  return (
    <div
      className={`group relative flex h-full min-h-[280px] flex-col p-5 transition ${
        isPro
          ? "pro-card hover:shadow-md"
          : "rounded-2xl border border-ink/5 bg-white shadow-sm hover:border-ink/10 hover:shadow-md"
      } ${loading ? "pointer-events-none opacity-60" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <Link
            href={primaryAction.href}
            className={`line-clamp-2 block font-display text-base font-bold text-ink transition-colors ${
              isPro ? "hover:text-[#9A5B12]" : "hover:text-teal"
            }`}
          >
            {job.title}
          </Link>
          <p className="mt-1 text-xs leading-relaxed text-ink/50">{formatJobSubtitle(job)}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span
            className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
              isPro && job.status === "ACTIVE" && !job.needsAttention
                ? "border-ink/10 bg-ink/5 text-ink"
                : status.className
            }`}
          >
            {status.label}
          </span>
          {canFeature && featured && (
            <span className="inline-flex items-center gap-1 rounded-full bg-marigold/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#9A5B12]">
              <Star className="h-2.5 w-2.5 fill-current" strokeWidth={0} />
              Featured
            </span>
          )}
        </div>
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

      {(isPro || job.applicantCount > 0) && (
        <div className={`mt-4 ${isPro ? "min-h-[52px]" : ""}`}>
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-ink/40">Pipeline</p>
          <EmployerPipelineBar
            applied={job.pipeline.applied}
            shortlisted={job.pipeline.shortlisted}
            interview={job.pipeline.interview}
            hired={job.pipeline.hired}
            variant={isPro ? "pro" : "free"}
          />
        </div>
      )}

      <div className="mt-4">
        <div className="mb-1 flex justify-between text-[10px] font-medium text-ink/50 sm:text-xs">
          <span>Hiring progress</span>
          <span className="font-data">
            {job.hiredCount}/{job.targetHireCount} hired
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-ink/5">
          <div
            className={`h-full rounded-full transition-all duration-500 ${isPro ? "bg-ink" : "bg-teal"}`}
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

      {job.reviewRejectionReason && job.status === "DRAFT" && (
        <div className="mt-3 rounded-lg border border-ember/15 bg-ember/5 px-2.5 py-2 text-[10px] leading-relaxed text-ember">
          <span className="font-semibold">Admin feedback: </span>
          {job.reviewRejectionReason}
        </div>
      )}

      {tips && tips.length > 0 && (
        <div
          className={`mt-3 rounded-lg px-2.5 py-2 text-[10px] leading-relaxed text-ink/70 ${
            isPro ? "border border-marigold/25 bg-marigold/[0.06]" : "border border-teal/15 bg-teal/5"
          }`}
        >
          <span className={`font-semibold ${isPro ? "text-[#9A5B12]" : "text-teal"}`}>Easy AI tips: </span>
          <ul className="mt-1 space-y-1">
            {tips.map((tip, i) => (
              <li key={i}>• {tip}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-auto pt-4">
        {isPro ? (
          <ProButton
            href={primaryAction.href}
            variant={primaryAction.variant === "primary" ? "primary" : "secondary"}
            fullWidth
            className="min-h-10 text-xs"
            icon={<ResolvedPrimaryIcon className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden="true" />}
          >
            {primaryAction.label}
          </ProButton>
        ) : (
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
        )}

        {secondaryActions.length > 0 && (
          <div className="mt-3.5 flex flex-wrap items-center gap-x-3.5 gap-y-2 px-0.5">
            {secondaryActions.map((action) => (
              <SecondaryAction
                key={action.key}
                href={action.href}
                onClick={action.onClick}
                icon={action.icon}
                label={action.label}
                danger={action.danger}
                isPro={isPro}
              />
            ))}
          </div>
        )}

        <p className="mt-2.5 text-[10px] text-ink/30">Updated {updatedLabel}</p>
      </div>

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center rounded-[1.75rem] bg-white/70">
          <div
            className={`h-5 w-5 animate-spin rounded-full border-2 border-t-transparent ${
              isPro ? "border-ink" : "border-teal"
            }`}
          />
        </div>
      )}
    </div>
  );
}
