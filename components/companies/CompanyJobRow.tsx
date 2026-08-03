import Link from "next/link";
import { MapPin, Wallet, ChevronRight } from "lucide-react";
import { formatEnumLabel, formatPesoRange } from "@/lib/format";
import Badge from "@/components/ui/Badge";

export type CompanyJobListItem = {
  id: string;
  title: string;
  category: string;
  employmentType: string;
  remoteType: string;
  location: string;
  salaryMin: number | null;
  salaryMax: number | null;
};

export default function CompanyJobRow({ job }: { job: CompanyJobListItem }) {
  return (
    <Link
      href={`/jobs/${job.id}`}
      className="group flex flex-wrap items-start justify-between gap-4 border-b border-ink/[0.06] py-5 transition-colors hover:bg-ink/[0.02]"
    >
      <div className="min-w-0 flex-1">
        <h3 className="font-display text-base font-bold text-ink transition group-hover:text-navy sm:text-lg">
          {job.title}
        </h3>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <Badge tone="marigold">{job.category}</Badge>
          <Badge tone="ink">{formatEnumLabel(job.employmentType)}</Badge>
          <Badge tone="teal">{formatEnumLabel(job.remoteType)}</Badge>
        </div>
        <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-ink/50">
          <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {job.location}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <p className="font-data text-sm font-semibold text-ink/75">
          <Wallet className="mr-1 inline h-4 w-4 text-teal/80" aria-hidden="true" />
          {formatPesoRange(job.salaryMin, job.salaryMax)}
        </p>
        <ChevronRight
          className="h-4 w-4 text-ink/25 transition group-hover:translate-x-0.5 group-hover:text-marigold"
          aria-hidden="true"
        />
      </div>
    </Link>
  );
}
