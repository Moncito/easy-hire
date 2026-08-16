import Link from "next/link";
import { Plus, Users, Sparkles } from "lucide-react";
import type { EmployerAnalytics } from "@/lib/employer-analytics";
import NeoSurface from "@/components/employer/pro/NeoSurface";
import NeoButton from "@/components/employer/pro/NeoButton";
import ProBadge from "@/components/employer/pro/ProBadge";
import EasyAiChip from "@/components/employer/pro/EasyAiChip";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

type Props = {
  companyName: string;
  analytics: Pick<
    EmployerAnalytics,
    "metrics" | "profileCompletion" | "newApplicantsThisWeek" | "insights"
  >;
};

/** Pro dashboard hero — neo raised band, "EasyHire Pro" mark, company name
 * slot, Easy AI insight placeholder, and one primary CTA. Drop-in Pro
 * counterpart to DashboardHero. */
export default function DashboardHeroPro({ companyName, analytics }: Props) {
  const { metrics, profileCompletion, newApplicantsThisWeek, insights } = analytics;
  const insight = insights.actionRequired || insights.marketInsight;

  return (
    <NeoSurface variant="raised" className="p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-display text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--neo-muted)]">
              {getGreeting()}
            </span>
            <ProBadge label="EasyHire Pro" size="sm" />
          </div>
          <h1 className="mt-1.5 truncate font-display text-2xl font-bold tracking-tight text-[color:var(--neo-ink)] sm:text-3xl">
            {companyName}
          </h1>

          <div className="mt-3 flex flex-wrap gap-2">
            {metrics.needsReview > 0 && (
              <span className="neo-inset-sm rounded-full px-3 py-1 text-xs font-semibold text-[color:var(--neo-ember)]">
                {metrics.needsReview} to review
              </span>
            )}
            {newApplicantsThisWeek > 0 && (
              <span className="neo-inset-sm rounded-full px-3 py-1 text-xs font-semibold text-[color:var(--neo-teal)]">
                +{newApplicantsThisWeek} this week
              </span>
            )}
            {profileCompletion < 100 && (
              <Link
                href="/employer/company-profile"
                className="neo-inset-sm rounded-full px-3 py-1 text-xs font-semibold text-[color:var(--neo-muted)] transition hover:text-[color:var(--neo-ink)]"
              >
                Profile {profileCompletion}% →
              </Link>
            )}
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2.5">
          <NeoButton href="/employer/jobs/new" variant="primary" icon={<Plus className="h-4 w-4" strokeWidth={2.5} />}>
            Post a job
          </NeoButton>
          <NeoButton
            href="/employer/applicants"
            variant="secondary"
            icon={<Users className="h-4 w-4" strokeWidth={2.5} />}
          >
            Review applicants
          </NeoButton>
        </div>
      </div>

      {/* Easy AI insight — TODO: replace with live `/api/employer/ai/insights`
          response once the Easy AI backend lands (see plans/EMPLOYER_PRO_DASHBOARD_PLAN.md). */}
      <div className="neo-inset-sm mt-5 flex items-start gap-3 rounded-xl px-4 py-3">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--neo-gold)]" strokeWidth={2.25} />
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[color:var(--neo-gold)]">
            Easy AI insight
          </p>
          <p className="mt-1 text-xs leading-relaxed text-[color:var(--neo-muted)]">
            {insight ?? "Easy AI will summarize your hiring health here once it's live — check back soon."}
          </p>
        </div>
        <EasyAiChip variant="inline" label="Open Easy AI" className="shrink-0" />
      </div>
    </NeoSurface>
  );
}
