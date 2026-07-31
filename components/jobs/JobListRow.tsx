"use client";

import { MapPin, Wallet } from "lucide-react";
import { formatEnumLabel, formatPesoRange, type SalaryPeriod } from "@/lib/format";
import { timeAgo, isClosingSoon, closingLabel } from "@/lib/time-ago";
import Badge from "@/components/ui/Badge";
import JobListQuickActions from "@/components/jobs/JobListQuickActions";
import type { JobCardData } from "@/components/jobs/JobListingCard";

type Props = {
  job: JobCardData;
  active: boolean;
  applied?: boolean;
  saved?: boolean;
  onToggleSaved?: (jobId: string, nextSaved: boolean) => void;
  onSelect: (jobId: string) => void;
};

export default function JobListRow({ job, active, applied, saved, onToggleSaved, onSelect }: Props) {
  const initials = job.company.companyName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  function handleActivate() {
    onSelect(job.id);
  }

  function handleClick(e: React.MouseEvent) {
    if (e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    handleActivate();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleActivate();
    }
  }

  return (
    <div
      role="option"
      aria-selected={active}
      data-job-id={job.id}
      tabIndex={active ? 0 : -1}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`group relative mb-1.5 cursor-pointer rounded-xl border border-l-[4px] px-3 py-3 outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-marigold/40 ${
        active
          ? "z-10 border-marigold/40 border-l-marigold bg-marigold/10 shadow-[0_4px_16px_rgba(242,169,59,0.14)]"
          : "border-l-transparent hover:border-marigold/30 hover:bg-white/80 hover:shadow-md"
      }`}
    >
      <div className="absolute right-2 top-2.5 z-10">
        <JobListQuickActions
          jobId={job.id}
          jobTitle={job.title}
          saved={!!saved}
          onToggleSaved={onToggleSaved}
        />
      </div>

      <div className="flex items-start gap-3 pr-16">
        {job.company.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={job.company.logoUrl} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" />
        ) : (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-navy/8 font-display text-xs font-bold text-navy">
            {initials}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 font-display text-sm font-bold leading-snug text-ink group-hover:text-navy">
            {job.title}
          </h3>
          <p className="truncate text-xs text-ink/50">{job.company.companyName}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <Badge tone="marigold" size="sm">
              {job.category}
            </Badge>
            <Badge tone="teal" size="sm">
              {formatEnumLabel(job.remoteType)}
            </Badge>
            {applied && (
              <Badge tone="ink" size="sm">
                Applied
              </Badge>
            )}
            {isClosingSoon(job.expiresAt) && (
              <Badge tone="ember" size="sm">
                {closingLabel(job.expiresAt!)}
              </Badge>
            )}
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[11px] text-ink/45">
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" aria-hidden="true" />
              {job.location}
            </span>
            <span className="inline-flex items-center gap-1 font-data font-semibold text-ink/65">
              <Wallet className="h-3 w-3" aria-hidden="true" />
              {formatPesoRange(job.salaryMin, job.salaryMax, (job.salaryPeriod as SalaryPeriod) || "MONTHLY")}
            </span>
          </div>
          {(job.publishedAt ?? job.createdAt) && (
            <p className="mt-1 text-[10px] text-ink/35">{timeAgo((job.publishedAt ?? job.createdAt)!)}</p>
          )}
        </div>
      </div>
    </div>
  );
}
