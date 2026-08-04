"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Sparkles } from "lucide-react";
import type { PublicJobListItem } from "@/lib/public-jobs";
import { formatPesoRange, formatEnumLabel } from "@/lib/format";
import type { SalaryPeriod } from "@/lib/format";

interface JobsTickerProps {
  jobs: PublicJobListItem[];
}

export default function JobsTicker({ jobs }: JobsTickerProps) {
  if (jobs.length === 0) return null;

  const mid = Math.max(1, Math.floor(jobs.length / 2));
  const rowA = jobs.length >= 4 ? jobs.slice(0, mid) : jobs;
  const rowB = jobs.length >= 4 ? jobs.slice(mid) : null;

  return (
    <section className="w-full bg-mist py-20 overflow-hidden">
      <div className="mx-auto max-w-6xl px-6 mb-12 text-center">
        {/* Pill badge */}
        <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-marigold/30 bg-marigold/10 px-4 py-2">
          <Sparkles className="h-3.5 w-3.5 fill-marigold/40 text-marigold" />
          <span className="text-xs font-semibold tracking-wide text-marigold">
            Fresh off the review desk
          </span>
        </div>

        <h2 className="font-display text-4xl md:text-6xl font-extrabold tracking-tight text-ink mb-4">
          Roles verified this week
        </h2>
        <p className="mx-auto max-w-xl text-base text-ink/60 mb-8">
          Every listing you see has passed our human review process. No spam, no scams.
        </p>
        <Link
          href="/jobs"
          className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-bold text-mist transition-all hover:bg-ink/85"
        >
          Browse all jobs
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Row A */}
      <MarqueeRow jobs={rowA} duration="40s" reverse={false} />

      {/* Row B (if enough jobs) */}
      {rowB && rowB.length > 0 && (
        <div className="mt-4">
          <MarqueeRow jobs={rowB} duration="48s" reverse={true} />
        </div>
      )}
    </section>
  );
}

function MarqueeRow({
  jobs,
  duration,
  reverse,
}: {
  jobs: PublicJobListItem[];
  duration: string;
  reverse: boolean;
}) {
  return (
    <div className={`landing-marquee-hover landing-marquee-mask overflow-hidden`}>
      <div
        className={`landing-marquee ${reverse ? "landing-marquee-reverse" : ""} flex items-stretch gap-4`}
        style={{ "--marquee-duration": duration } as React.CSSProperties}
      >
        {/* First copy */}
        {jobs.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
        {/* Second copy — seamless loop */}
        <div aria-hidden="true" className="flex items-stretch gap-4">
          {jobs.map((job) => (
            <JobCard key={`dup-${job.id}`} job={job} />
          ))}
        </div>
      </div>
    </div>
  );
}

function JobCard({ job }: { job: PublicJobListItem }) {
  const salary =
    job.salaryMin != null || job.salaryMax != null
      ? formatPesoRange(job.salaryMin, job.salaryMax, job.salaryPeriod as SalaryPeriod)
      : "Salary undisclosed";

  return (
    <Link
      href={`/jobs/${job.id}`}
      className="group flex w-[320px] shrink-0 flex-col gap-2 rounded-2xl border border-ink/10 bg-white/70 p-4 backdrop-blur-sm transition-all duration-200 hover:-translate-y-1 hover:border-marigold/40 hover:shadow-md"
    >
      <p className="font-display font-bold text-sm text-ink truncate">{job.title}</p>

      <div className="flex items-center gap-1.5 text-xs text-ink/60">
        <span className="truncate">{job.company.companyName}</span>
        {job.company.verifiedStatus === "APPROVED" && (
          <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-teal fill-teal/20" />
        )}
      </div>

      <p className="font-data text-xs text-ink/70">{salary}</p>

      <div className="mt-auto">
        <span className="inline-block rounded-full bg-ink/6 px-2.5 py-1 text-[10px] font-medium text-ink/60">
          {formatEnumLabel(job.employmentType)}
        </span>
      </div>
    </Link>
  );
}
