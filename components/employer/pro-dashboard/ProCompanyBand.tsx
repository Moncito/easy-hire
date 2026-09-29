import Link from "next/link";
import { Check, MapPin, Plus, Users } from "lucide-react";

import EmployerAvatar from "@/components/employer/ui/EmployerAvatar";
import ProRangeControl from "@/components/employer/pro-dashboard/ProRangeControl";
import type { DashboardRange } from "@/lib/employer/dashboard-insights";

type Props = {
  companyName: string;
  companyLogoUrl?: string | null;
  headquarters?: string | null;
  verifiedStatus: string;
  range: DashboardRange;
};

/**
 * Dashboard header: who you are, the date range every chart and delta
 * below uses, and the two next actions. The tagline and the Easy AI line
 * that used to sit here are gone — Easy AI's suggestions now have their own
 * card, and the company description belongs on the Company page.
 */
export default function ProCompanyBand({ companyName, companyLogoUrl, headquarters, verifiedStatus, range }: Props) {
  return (
    <header className="flex flex-wrap items-center gap-3.5">
      <EmployerAvatar
        name={companyName}
        imageUrl={companyLogoUrl}
        size="lg"
        shape="rounded"
        className="!h-12 !w-12 shrink-0 !rounded-control"
        fallbackClassName="bg-ink text-white text-[15px] font-bold"
      />
      <div className="min-w-0">
        <h1 className="truncate text-page-title text-eh-ink">{companyName}</h1>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-ui text-eh-muted">
          {verifiedStatus === "APPROVED" && (
            <span className="inline-flex items-center gap-1 text-eh-success">
              <Check className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
              Verified employer
            </span>
          )}
          {headquarters && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
              {headquarters}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 max-[520px]:w-full min-[521px]:ml-auto">
        <ProRangeControl range={range} />
        <Link
          href="/employer/applicants"
          className="inline-flex h-9 items-center gap-1.5 rounded-control border border-eh-line bg-eh-surface px-3.5 text-ui font-medium text-eh-ink transition hover:bg-eh-surface-2"
        >
          <Users className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
          Review applicants
        </Link>
        <Link
          href="/employer/jobs/new"
          className="inline-flex h-9 items-center gap-1.5 rounded-control border border-eh-marigold bg-eh-marigold px-3.5 text-ui font-semibold text-[#241500] transition hover:border-eh-marigold-strong hover:bg-eh-marigold-strong"
        >
          <Plus className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
          Post a job
        </Link>
      </div>
    </header>
  );
}
