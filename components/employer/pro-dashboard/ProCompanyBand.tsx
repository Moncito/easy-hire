import { Plus, Users, MapPin, BadgeCheck } from "lucide-react";

import EmployerAvatar from "@/components/employer/ui/EmployerAvatar";
import EasyAiInsightBox from "@/components/employer/dashboard/EasyAiInsightBox";
import ProButton from "@/components/employer/pro/ProButton";
import type { EmployerAnalytics } from "@/lib/employer-analytics";

type Props = {
  companyName: string;
  companyLogoUrl?: string | null;
  description?: string | null;
  headquarters?: string | null;
  industry?: string | null;
  verifiedStatus: string;
  analytics: Pick<
    EmployerAnalytics,
    "metrics" | "hiringScore" | "newApplicantsThisWeek" | "insights"
  >;
};

export default function ProCompanyBand({
  companyName,
  companyLogoUrl,
  description,
  headquarters,
  industry,
  verifiedStatus,
  analytics,
}: Props) {
  const { insights } = analytics;
  const tagline =
    description?.trim() ||
    industry?.trim() ||
    "Your hiring pipeline at a glance.";
  const insight = insights.actionRequired || insights.marketInsight;

  return (
    <header className="flex flex-col gap-4 border-b border-ink/[0.06] pb-5 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
      <div className="flex min-w-0 gap-4">
        <EmployerAvatar
          name={companyName}
          imageUrl={companyLogoUrl}
          size="lg"
          shape="rounded"
          className="h-14 w-14 shrink-0 sm:h-16 sm:w-16"
          fallbackClassName="bg-marigold text-ink text-xl font-bold"
        />
        <div className="min-w-0">
          <h1 className="line-clamp-2 font-display text-3xl font-black tracking-tighter text-ink sm:text-4xl sm:leading-[0.95]">
            {companyName}
          </h1>
          <p className="mt-1 line-clamp-1 text-sm text-ink/50">{tagline}</p>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink/45 sm:text-sm">
            {verifiedStatus === "APPROVED" && (
              <span className="inline-flex items-center gap-1 font-medium text-teal">
                <BadgeCheck className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
                Verified
              </span>
            )}
            {headquarters && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
                {headquarters}
              </span>
            )}
          </div>

          <EasyAiInsightBox fallback={insight} variant="inline" />
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
        <ProButton
          href="/employer/jobs/new"
          variant="primary"
          icon={<Plus className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />}
        >
          Post a job
        </ProButton>
        <ProButton
          href="/employer/applicants"
          variant="secondary"
          icon={<Users className="h-4 w-4" strokeWidth={2} aria-hidden="true" />}
        >
          Review applicants
        </ProButton>
      </div>
    </header>
  );
}
