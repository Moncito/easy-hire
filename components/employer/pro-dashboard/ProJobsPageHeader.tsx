import Link from "next/link";
import { ChevronRight, Plus } from "lucide-react";
import { AttentionBanner, Button, PageHeader } from "@/components/employer/system";
import type { EmployerJobsSummary } from "@/lib/employer-jobs";
import type { AttentionItem } from "@/lib/employer-analytics";

export type OverdueSummary = {
  /** Listings whose oldest unreviewed applicant is past the 14-day target. */
  jobCount: number;
  oldest: { jobId: string; title: string; days: number };
};

type Props = {
  summary: EmployerJobsSummary;
  companyVerified: boolean;
  overdue: OverdueSummary | null;
  /** Secondary reminders (pending admin review, listings with no views). */
  reminders: AttentionItem[];
};

function plural(n: number, one: string, many = `${one}s`) {
  return `${n} ${n === 1 ? one : many}`;
}

/**
 * Job postings header: title, the three numbers that matter, and the one
 * page-level alarm. The alarm appears only once a wait is past the 14-day
 * target — shorter waits are already visible on the cards themselves.
 */
export default function ProJobsPageHeader({ summary, companyVerified, overdue, reminders }: Props) {
  return (
    <div className="mb-6 flex flex-col gap-6">
      <PageHeader
        title="Job postings"
        description={
          companyVerified
            ? "Verified Pro — new listings go live instantly. Unlimited roles, feature any job."
            : "Unlimited roles and featured listings. Finish verification to skip the admin publish queue."
        }
        meta={
          <>
            <span>
              <b className="num font-semibold text-eh-ink">{summary.active}</b> active{" "}
              {summary.active === 1 ? "job" : "jobs"}
            </span>
            <span aria-hidden="true" className="hidden sm:inline">·</span>
            <span>
              <b className="num font-semibold text-eh-ink">{summary.totalApplicants}</b>{" "}
              {summary.totalApplicants === 1 ? "applicant" : "applicants"}
            </span>
            {summary.needsReviewApplicants > 0 && (
              <>
                <span aria-hidden="true" className="hidden sm:inline">·</span>
                <Link
                  href="/employer/applicants?filter=NEEDS_REVIEW"
                  className="font-medium text-eh-marigold-ink transition-colors duration-150 hover:text-eh-ink"
                >
                  <b className="num font-semibold">{summary.needsReviewApplicants}</b> need review
                </Link>
              </>
            )}
          </>
        }
        actions={
          <Button href="/employer/jobs/new" variant="primary" icon={<Plus />}>
            Post a new job
          </Button>
        }
      />

      {overdue && (
        <AttentionBanner
          tone="critical"
          title={
            overdue.jobCount === 1
              ? `An applicant on ${overdue.oldest.title} has waited ${plural(overdue.oldest.days, "day")}`
              : `${overdue.jobCount} listings have applicants waiting over 14 days`
          }
          description={
            overdue.jobCount === 1
              ? "That's past the 14-day decision target. A quick yes or no keeps candidates engaged."
              : `The longest wait is ${plural(overdue.oldest.days, "day")} on ${overdue.oldest.title}.`
          }
          action={
            <Button
              size="sm"
              href={
                overdue.jobCount === 1
                  ? `/employer/jobs/${overdue.oldest.jobId}/applicants`
                  : "/employer/applicants?filter=NEEDS_REVIEW"
              }
            >
              Review applicants
            </Button>
          }
        />
      )}

      {reminders.length > 0 && (
        <p className="-mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-ui text-eh-muted">
          {reminders.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="inline-flex items-center gap-0.5 transition-colors duration-150 hover:text-eh-ink"
            >
              {item.label}
              <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          ))}
        </p>
      )}
    </div>
  );
}
