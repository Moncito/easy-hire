import Link from "next/link";
import { Plus } from "lucide-react";
import { EmployerPrimaryButton } from "@/components/employer/ui/EmployerPageHeader";
import type { EmployerJobsSummary } from "@/lib/employer-jobs";

type Props = {
  summary: EmployerJobsSummary;
};

export default function JobsPageHeader({ summary }: Props) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
      <div>
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink">
            Job postings
          </h1>
          <span className="font-data text-sm font-semibold text-ink/40">{summary.total} total</span>
        </div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink/50">
          <span>
            <span className="font-data font-semibold text-ink">{summary.active}</span> active
          </span>
          <span>
            <span className="font-data font-semibold text-ink">{summary.totalApplicants}</span>{" "}
            applicants
          </span>
          {summary.needsReviewApplicants > 0 && (
            <Link href="/employer/applicants?filter=NEEDS_REVIEW" className="font-semibold text-teal hover:underline">
              {summary.needsReviewApplicants} need review
            </Link>
          )}
        </div>
      </div>
      <EmployerPrimaryButton href="/employer/jobs/new">
        <Plus className="h-4 w-4" strokeWidth={2.5} />
        Post a new job
      </EmployerPrimaryButton>
    </div>
  );
}
