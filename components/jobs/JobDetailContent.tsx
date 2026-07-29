import { MapPin, Wallet, Building2, Globe, Briefcase, Clock, AlarmClock } from "lucide-react";
import { formatEnumLabel, formatPesoRange, type SalaryPeriod } from "@/lib/format";
import { timeAgo, isClosingSoon, closingLabel } from "@/lib/time-ago";
import Badge from "@/components/ui/Badge";
import Divider from "@/components/ui/Divider";
import MarkdownContent from "@/components/ui/MarkdownContent";

export type JobDetailData = {
  id: string;
  title: string;
  description: string;
  requirements: string | null;
  benefits: string | null;
  category: string;
  industry: string | null;
  employmentType: string;
  remoteType: string;
  location: string;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryPeriod: string;
  publishedAt: string | null;
  expiresAt?: string | null;
  company: {
    id: string;
    companyName: string;
    logoUrl: string | null;
    bannerUrl?: string | null;
    description?: string | null;
    website?: string | null;
    industry: string | null;
    verifiedStatus: string;
    headquarters?: string | null;
  };
};

/** Card-free description section — a heading + divider instead of a bordered box. */
function DetailSection({ title, content }: { title: string; content: string }) {
  return (
    <section>
      <h2 className="font-display text-base font-bold text-ink">{title}</h2>
      <div className="mt-3">
        <MarkdownContent content={content} />
      </div>
    </section>
  );
}

export default function JobDetailContent({
  job,
  variant = "page",
  applyAction,
}: {
  job: JobDetailData;
  variant?: "page" | "panel";
  applyAction?: React.ReactNode;
}) {
  const initials = job.company.companyName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className={variant === "panel" ? "space-y-6" : "space-y-6"}>
      <header>
        <div className="flex flex-wrap items-start gap-4">
          {job.company.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={job.company.logoUrl}
              alt=""
              className={`shrink-0 rounded-2xl border-2 border-white object-cover shadow-md ${
                variant === "panel" ? "h-14 w-14" : "h-16 w-16 sm:h-20 sm:w-20"
              }`}
            />
          ) : (
            <div
              className={`flex shrink-0 items-center justify-center rounded-2xl border-2 border-white bg-marigold/15 font-display font-bold text-marigold shadow-md ${
                variant === "panel" ? "h-14 w-14 text-lg" : "h-16 w-16 text-xl sm:h-20 sm:w-20"
              }`}
            >
              {initials}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap gap-2">
              <Badge tone="marigold">{job.category}</Badge>
              <Badge tone="ink">{formatEnumLabel(job.employmentType)}</Badge>
              <Badge tone="teal">{formatEnumLabel(job.remoteType)}</Badge>
            </div>
            <h1
              className={`mt-3 font-display font-bold tracking-tight text-ink ${
                variant === "panel" ? "text-xl sm:text-2xl" : "text-2xl sm:text-3xl lg:text-4xl"
              }`}
            >
              {job.title}
            </h1>
            <p className="mt-1 text-sm font-medium text-ink/55">{job.company.companyName}</p>
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-ink/60">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-navy/50" aria-hidden="true" />
                {job.location}
              </span>
              <span className="inline-flex items-center gap-1.5 font-data font-semibold text-ink/80">
                <Wallet className="h-4 w-4 text-navy/50" aria-hidden="true" />
                {formatPesoRange(job.salaryMin, job.salaryMax, job.salaryPeriod as SalaryPeriod)}
              </span>
              {job.publishedAt && (
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-navy/50" aria-hidden="true" />
                  {timeAgo(job.publishedAt)}
                </span>
              )}
              {isClosingSoon(job.expiresAt) && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-ember/10 px-2.5 py-0.5 text-xs font-bold text-ember">
                  <AlarmClock className="h-3.5 w-3.5" aria-hidden="true" />
                  {closingLabel(job.expiresAt!)}
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {applyAction}

      <Divider />

      <DetailSection title="About the role" content={job.description} />

      {job.requirements && (
        <>
          <Divider />
          <DetailSection title="Requirements" content={job.requirements} />
        </>
      )}

      {job.benefits && (
        <>
          <Divider />
          <DetailSection title="Benefits & perks" content={job.benefits} />
        </>
      )}

      <Divider />

      <section>
        <h2 className="font-display text-base font-bold text-ink">About {job.company.companyName}</h2>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-ink/60">
          {job.company.verifiedStatus === "APPROVED" && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-teal/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-teal">
              Verified employer
            </span>
          )}
          {job.company.industry && (
            <span className="inline-flex items-center gap-1.5">
              <Briefcase className="h-3.5 w-3.5" />
              {job.company.industry}
            </span>
          )}
          {job.company.headquarters && (
            <span className="inline-flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5" />
              {job.company.headquarters}
            </span>
          )}
          {job.company.website && (
            <a
              href={job.company.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex cursor-pointer items-center gap-1.5 text-teal hover:underline"
            >
              <Globe className="h-3.5 w-3.5" aria-hidden="true" />
              Website
            </a>
          )}
        </div>
      </section>
    </div>
  );
}
