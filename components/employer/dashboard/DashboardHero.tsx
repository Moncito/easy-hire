import Link from "next/link";
import { Plus, Users, Sparkles } from "lucide-react";
import type { EmployerAnalytics } from "@/lib/employer-analytics";

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
  compact?: boolean;
};

export default function DashboardHero({ companyName, analytics, compact = false }: Props) {
  const { metrics, profileCompletion, newApplicantsThisWeek, insights } = analytics;

  if (compact) {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-navy shadow-[0_12px_40px_-12px_rgba(30,58,95,0.45)] ring-1 ring-navy/20">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(31,128,115,0.14)_0%,transparent_42%,rgba(255,255,255,0.04)_100%)]" />
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-teal/15 blur-2xl" />
        <div className="relative flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="min-w-0">
            <p className="text-xs font-medium text-mist/55">{getGreeting()}</p>
            <h1 className="mt-0.5 truncate font-display text-xl font-bold tracking-tight text-mist sm:text-2xl">
              {companyName}
            </h1>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {metrics.needsReview > 0 && (
                <span className="rounded-full bg-ember/20 px-2.5 py-0.5 text-[11px] font-semibold text-mist">
                  {metrics.needsReview} to review
                </span>
              )}
              {newApplicantsThisWeek > 0 && (
                <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold text-mist/90">
                  +{newApplicantsThisWeek} this week
                </span>
              )}
              {profileCompletion < 100 && (
                <Link
                  href="/employer/company-profile"
                  className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold text-mist/90 transition hover:bg-white/15"
                >
                  Profile {profileCompletion}% →
                </Link>
              )}
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Link
              href="/employer/jobs/new"
              className="inline-flex items-center gap-2 rounded-xl bg-teal px-4 py-2 text-sm font-semibold text-white shadow-md shadow-teal/30 transition hover:bg-teal/95"
            >
              <Plus className="h-4 w-4" strokeWidth={2.5} />
              Post a job
            </Link>
            <Link
              href="/employer/applicants"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold text-mist transition hover:bg-white/10"
            >
              <Users className="h-4 w-4" strokeWidth={2.5} />
              Review applicants
            </Link>
          </div>
        </div>
        {insights.actionRequired && (
          <div className="relative border-t border-white/10 px-5 py-2.5 sm:px-6">
            <div className="flex items-start gap-2">
              <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal" />
              <p className="text-[11px] leading-relaxed text-mist/75">{insights.actionRequired}</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-navy p-6 shadow-lg shadow-navy/20 sm:p-8">
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-teal/10 blur-2xl" />
      <div className="relative">
        <p className="text-sm font-medium text-mist/60">{getGreeting()}</p>
        <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-mist sm:text-3xl">
          {companyName}
        </h1>

        <div className="mt-4 flex flex-wrap gap-2">
          {metrics.needsReview > 0 && (
            <span className="rounded-full bg-ember/20 px-3 py-1 text-xs font-semibold text-mist">
              Needs review: {metrics.needsReview} applicant{metrics.needsReview === 1 ? "" : "s"}
            </span>
          )}
          {newApplicantsThisWeek > 0 && (
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-mist/90">
              {newApplicantsThisWeek} new this week
            </span>
          )}
          {profileCompletion < 100 && (
            <Link
              href="/employer/company-profile"
              className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-mist/90 transition hover:bg-white/15"
            >
              Profile {profileCompletion}% complete →
            </Link>
          )}
        </div>

        {insights.actionRequired && (
          <div className="mt-4 flex items-start gap-2 rounded-xl bg-white/8 px-3 py-2.5 ring-1 ring-white/10">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-teal" />
            <p className="text-xs leading-relaxed text-mist/80">{insights.actionRequired}</p>
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/employer/jobs/new"
            className="inline-flex items-center gap-2 rounded-xl bg-teal px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-teal/30 transition hover:bg-teal/95 active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            Post a job
          </Link>
          <Link
            href="/employer/applicants"
            className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-5 py-2.5 text-sm font-semibold text-mist transition hover:bg-white/10 active:scale-[0.98]"
          >
            <Users className="h-4 w-4" strokeWidth={2.5} />
            Review applicants
          </Link>
        </div>
      </div>
    </div>
  );
}
