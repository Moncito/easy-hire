"use client";

import { MapPin, Wallet } from "lucide-react";
import { formatEnumLabel, formatPesoRange, type SalaryPeriod } from "@/lib/format";
import { timeAgo, isClosingSoon, closingLabel } from "@/lib/time-ago";
import Badge from "@/components/ui/Badge";
import SaveJobButton from "@/components/jobs/SaveJobButton";
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

  function handleClick(e: React.MouseEvent) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    onSelect(job.id);
  }

  return (
    <a
      href={`/jobs/${job.id}`}
      onClick={handleClick}
      className={`group block cursor-pointer border-l-2 px-4 py-4 transition-colors ${
        active ? "border-marigold bg-marigold/6" : "border-transparent hover:bg-ink/3"
      }`}
    >
      <div className="flex items-start gap-3">
        {job.company.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={job.company.logoUrl} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" />
        ) : (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-navy/8 font-display text-xs font-bold text-navy">
            {initials}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate font-display text-sm font-bold text-ink group-hover:text-navy">
              {job.title}
            </h3>
            <SaveJobButton jobId={job.id} saved={!!saved} onToggle={onToggleSaved} className="p-1" />
          </div>
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
    </a>
  );
}
