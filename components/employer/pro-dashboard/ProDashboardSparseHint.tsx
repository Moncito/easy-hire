import Link from "next/link";
import { ArrowRight } from "lucide-react";

type Props = {
  activeJobs: number;
  newApplicantsThisWeek: number;
};

/** Concise actionable line when weekly trend is empty — replaces a large chart empty state. */
export default function ProDashboardSparseHint({ activeJobs, newApplicantsThisWeek }: Props) {
  const message =
    activeJobs === 0
      ? "Post your first role to start receiving applications."
      : newApplicantsThisWeek === 0
        ? "No new applications this week — share listings or refresh job descriptions."
        : null;

  if (!message) return null;

  return (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-ink/[0.06] pt-5 text-sm text-ink/55">
      <span>{message}</span>
      <Link
        href={activeJobs === 0 ? "/employer/jobs/new" : "/employer/jobs"}
        className="inline-flex items-center gap-1 font-semibold text-teal hover:underline"
      >
        {activeJobs === 0 ? "Post a job" : "Manage jobs"}
        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
      </Link>
    </p>
  );
}
