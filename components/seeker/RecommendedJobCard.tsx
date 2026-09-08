import Link from "next/link";
import Image from "next/image";
import { MapPin, Wallet, Clock } from "lucide-react";
import { formatEnumLabel, formatSalaryRange, type SalaryPeriod } from "@/lib/shared/format";
import { timeAgo } from "@/lib/time-ago";
import type { RecommendedJob } from "@/lib/seeker/job-recommendations";
import SaveJobButton from "@/components/jobs/SaveJobButton";

type Props = {
  job: RecommendedJob;
  saved: boolean;
  /**
   * Dashboard teaser density: logo, title, company, match band, and the
   * single top reason only — no chip row, no location/salary/posted meta
   * row. The full page (compact=false, the default) is where detail lives.
   */
  compact?: boolean;
};

function companyInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/**
 * Qualitative band for the 0-100 match score. Deliberately stays inside the
 * marigold/navy/ink palette — a weak match is not a warning, so Ember is
 * never used here (see CLAUDE.md: Ember is reserved for genuine
 * warnings/rejections).
 */
function matchBand(score: number): { label: string; className: string } {
  if (score >= 70) {
    return { label: "Strong match", className: "bg-marigold/20 text-[#8a5a10]" };
  }
  if (score >= 50) {
    return { label: "Good match", className: "bg-navy/8 text-navy" };
  }
  return { label: "Possible match", className: "bg-ink/[0.06] text-ink/55" };
}

export default function RecommendedJobCard({ job, saved, compact = false }: Props) {
  const postedAt = job.publishedAt ?? job.createdAt ?? null;
  const verified = job.company.verifiedStatus === "APPROVED";
  const band = matchBand(job.score);
  const visibleReasons = compact ? job.reasons.slice(0, 1) : job.reasons;

  return (
    <li className="group flex flex-col gap-4 py-5 transition-colors hover:bg-ink/[0.02] sm:flex-row sm:items-start sm:gap-6">
      <div className="flex min-w-0 flex-1 items-start gap-4">
        {job.company.logoUrl ? (
          <Image
            src={job.company.logoUrl}
            alt=""
            width={48}
            height={48}
            className="h-12 w-12 shrink-0 rounded-xl object-cover ring-1 ring-ink/8"
          />
        ) : (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-navy/8 font-display text-sm font-bold text-navy">
            {companyInitials(job.company.companyName)}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/jobs/${job.id}`}
              className="font-display text-base font-bold text-ink transition hover:text-navy sm:text-lg"
            >
              {job.title}
            </Link>
            {verified && (
              <span className="rounded-md bg-teal/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-teal">
                Verified
              </span>
            )}
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${band.className}`}
              aria-label={`Match strength: ${band.label}, score ${job.score} out of 100`}
            >
              {band.label}
              <span className="font-data font-semibold" aria-hidden="true">
                {job.score}
              </span>
            </span>
          </div>
          <p className="mt-0.5 text-sm text-ink/50">{job.company.companyName}</p>

          {visibleReasons.length > 0 && (
            <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Why this job matched">
              {visibleReasons.map((reason) => (
                <li
                  key={reason}
                  className="rounded-full bg-marigold/10 px-2.5 py-1 text-[11px] font-semibold text-[#8a5a10]"
                >
                  {reason}
                </li>
              ))}
            </ul>
          )}

          {!compact && (
            <>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                <span className="rounded-full bg-marigold/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#8a5a10]">
                  {job.category}
                </span>
                <span className="rounded-full bg-ink/[0.06] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink/50">
                  {formatEnumLabel(job.employmentType)}
                </span>
                <span className="rounded-full bg-teal/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-teal">
                  {formatEnumLabel(job.remoteType)}
                </span>
              </div>

              <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink/45">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3" aria-hidden="true" />
                  {job.location}
                </span>
                <span className="inline-flex items-center gap-1 font-data font-medium text-ink/60">
                  <Wallet className="h-3 w-3" aria-hidden="true" />
                  {formatSalaryRange(job.salaryMin, job.salaryMax, (job.salaryPeriod as SalaryPeriod) || "MONTHLY")}
                </span>
                {postedAt && (
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" aria-hidden="true" />
                    {timeAgo(postedAt)}
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:mt-0.5 sm:gap-3">
        <SaveJobButton jobId={job.id} saved={saved} />
        <Link
          href={`/jobs/${job.id}`}
          className="inline-flex cursor-pointer rounded-full bg-navy px-4 py-2 text-xs font-semibold text-mist transition hover:bg-navy/90"
        >
          Quick apply
        </Link>
      </div>
    </li>
  );
}
