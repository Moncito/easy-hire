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
};

export default function DashboardHero({ companyName, analytics }: Props) {
  const { metrics, profileCompletion, newApplicantsThisWeek, insights } = analytics;

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
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-mist/90">
              Profile {profileCompletion}% complete
            </span>
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
