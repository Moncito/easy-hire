"use client";

import Link from "next/link";
import { MapPin, Wallet } from "lucide-react";
import { formatEnumLabel, formatPesoRange } from "@/lib/format";

export type JobCardData = {
  id: string;
  title: string;
  category: string;
  employmentType: string;
  remoteType: string;
  location: string;
  salaryMin: number | null;
  salaryMax: number | null;
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
};

export default function JobListingCard({ job, applied }: Props) {
  const initials = job.company.companyName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Link
      href={`/jobs/${job.id}`}
      className="group block cursor-pointer rounded-2xl border border-navy/8 bg-white p-6 transition-all duration-300 animate-slide-up hover:-translate-y-0.5 hover:border-navy/20 hover:shadow-[0_8px_30px_rgba(30,58,95,0.06)] sm:p-7"
    >
      <div className="flex items-start gap-4">
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
          </div>
          <p className="mt-0.5 text-sm text-ink/55">{job.company.companyName}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="rounded-lg bg-marigold/10 px-2.5 py-1 text-[11px] font-semibold text-[#8a5a10]">
          {job.category}
        </span>
        <span className="rounded-lg bg-ink/5 px-2.5 py-1 text-[11px] font-semibold text-ink/65">
          {formatEnumLabel(job.employmentType)}
        </span>
        <span className="rounded-lg bg-teal/8 px-2.5 py-1 text-[11px] font-semibold text-teal">
          {formatEnumLabel(job.remoteType)}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-ink/5 pt-3 text-xs text-ink/50">
        <span className="inline-flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
          {job.location}
        </span>
        <span className="inline-flex items-center gap-1.5 font-data font-semibold text-ink/75">
          <Wallet className="h-3.5 w-3.5 text-navy/50" aria-hidden="true" />
          {formatPesoRange(job.salaryMin, job.salaryMax)}
        </span>
      </div>
    </Link>
  );
}
