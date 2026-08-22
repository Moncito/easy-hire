import Link from "next/link";
import { MapPin, Wallet, ChevronRight } from "lucide-react";
import { formatEnumLabel, formatPesoRange } from "@/lib/format";

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
      className="group flex flex-wrap items-start justify-between gap-4 rounded-xl border border-[#E4E2DC] bg-white px-5 py-5 shadow-[0_1px_2px_rgba(17,17,16,0.04)] transition hover:-translate-y-px hover:border-[#E8C97A] hover:shadow-[0_4px_14px_rgba(17,17,16,0.08)]"
    >
      <div className="min-w-0 flex-1">
        <h3 className="font-display text-base font-bold text-[#111110] transition group-hover:text-navy sm:text-lg">
          {job.title}
        </h3>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          <span className="inline-flex items-center rounded-full border border-[#E8C97A] bg-[#FBF3E0] px-2.5 py-0.5 text-[11px] font-semibold text-[#7A4F0D]">
            {job.category}
          </span>
          <span className="inline-flex items-center rounded-full border border-[#E4E2DC] bg-[#F5F4F0] px-2.5 py-0.5 text-[11px] font-semibold text-[#6F6E69]">
            {formatEnumLabel(job.employmentType)}
          </span>
          <span className="inline-flex items-center rounded-full border border-teal/25 bg-teal/10 px-2.5 py-0.5 text-[11px] font-semibold text-[#165E54]">
            {formatEnumLabel(job.remoteType)}
          </span>
        </div>
        <p className="mt-2.5 inline-flex items-center gap-1.5 text-sm text-[#6F6E69]">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-[#A8A49D]" aria-hidden="true" />
          {job.location}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <p className="font-data text-sm font-semibold text-[#111110]">
          <Wallet className="mr-1 inline h-4 w-4 text-teal/80" aria-hidden="true" />
          {formatPesoRange(job.salaryMin, job.salaryMax)}
        </p>
        <ChevronRight
          className="h-4 w-4 text-[#A8A49D] transition group-hover:translate-x-0.5 group-hover:text-[#D4930A]"
          aria-hidden="true"
        />
      </div>
    </Link>
  );
}
