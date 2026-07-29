"use client";

import Link from "next/link";
import { MapPin, Wallet, Clock } from "lucide-react";
import { formatEnumLabel, formatPesoRange, type SalaryPeriod } from "@/lib/format";
import Badge from "@/components/ui/Badge";
import SaveJobButton from "@/components/jobs/SaveJobButton";
import { timeAgo, isClosingSoon, closingLabel } from "@/lib/time-ago";

export type JobCardData = {
  id: string;
  title: string;
  category: string;
  industry?: string | null;
  employmentType: string;
  remoteType: string;
  location: string;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryPeriod?: string;
  publishedAt?: string | null;
  createdAt?: string;
  expiresAt?: string | null;
  company: {
    id: string;
    companyName: string;
    logoUrl: string | null;
    verifiedStatus: string;
    industry: string | null;
  };
};

type Props = {
  job: JobCardData;
  applied?: boolean;
  saved?: boolean;
  onToggleSaved?: (jobId: string, nextSaved: boolean) => void;
  showSaveButton?: boolean;
};

export default function JobListingCard({ job, applied, saved, onToggleSaved, showSaveButton = true }: Props) {
  const initials = job.company.companyName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const postedAt = job.publishedAt ?? job.createdAt ?? null;

  return (
    <div className="group relative rounded-2xl border border-navy/8 bg-white p-6 transition-all duration-300 animate-slide-up hover:-translate-y-0.5 hover:border-navy/20 hover:shadow-[0_8px_30px_rgba(30,58,95,0.06)] sm:p-7">
      {showSaveButton && (
        <div className="absolute right-5 top-5">
          <SaveJobButton jobId={job.id} saved={!!saved} onToggle={onToggleSaved} />
        </div>
      )}
      <Link href={`/jobs/${job.id}`} className="block cursor-pointer">
        <div className="flex items-start gap-4 pr-8">
          {job.company.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={job.company.logoUrl} alt="" className="h-12 w-12 rounded-xl object-cover" />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-navy/8 font-display text-sm font-bold text-navy">
              {initials}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-xl font-bold text-ink transition-colors group-hover:text-navy sm:text-[1.35rem]">
                {job.title}
              </h2>
              {job.company.verifiedStatus === "APPROVED" && (
                <span className="rounded-md bg-teal/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-teal">
                  Verified
                </span>
              )}
              {applied && (
                <span className="rounded-md bg-marigold/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#8a5a10]">
                  Applied
                </span>
              )}
              {isClosingSoon(job.expiresAt) && (
                <span className="rounded-md bg-ember/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ember">
                  {closingLabel(job.expiresAt!)}
                </span>
              )}
            </div>
            <p className="mt-0.5 text-sm text-ink/55">{job.company.companyName}</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Badge tone="marigold">{job.category}</Badge>
          <Badge tone="ink">{formatEnumLabel(job.employmentType)}</Badge>
          <Badge tone="teal">{formatEnumLabel(job.remoteType)}</Badge>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-ink/5 pt-3 text-xs text-ink/50">
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
            {job.location}
          </span>
          <span className="inline-flex items-center gap-1.5 font-data font-semibold text-ink/75">
            <Wallet className="h-3.5 w-3.5 text-navy/50" aria-hidden="true" />
            {formatPesoRange(job.salaryMin, job.salaryMax, (job.salaryPeriod as SalaryPeriod) || "MONTHLY")}
          </span>
          {postedAt && (
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              {timeAgo(postedAt)}
            </span>
          )}
        </div>
      </Link>
    </div>
  );
}
