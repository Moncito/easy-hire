import { Check, MapPin, Plus, Users } from "lucide-react";

import { Avatar, Button, PageHeader } from "@/components/employer/system";
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
    <PageHeader
      title={companyName}
      leading={<Avatar name={companyName} src={companyLogoUrl} size="lg" shape="square" />}
      meta={
        <>
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
        </>
      }
      actions={
        <>
          <ProRangeControl range={range} />
          <Button href="/employer/applicants" icon={<Users />}>
            Review applicants
          </Button>
          <Button href="/employer/jobs/new" variant="primary" icon={<Plus />}>
            Post a job
          </Button>
        </>
      }
    />
  );
}
