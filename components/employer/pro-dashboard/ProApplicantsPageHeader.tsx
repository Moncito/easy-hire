import Link from "next/link";
import { Download, Sparkles } from "lucide-react";
import { AttentionBanner, Button, PageHeader } from "@/components/employer/system";
import type { OverdueSummary } from "@/components/employer/pro-dashboard/ProJobsPageHeader";
import type { EmployerJobsSummary } from "@/lib/employer-jobs";

type Props = {
  summary: EmployerJobsSummary;
  jobsWithApplicants: number;
  pipeline: { interview: number; hired: number };
  overdue: OverdueSummary | null;
};

/** Dot between stats; hidden on phones, where the stats wrap and a leading dot would dangle. */
function Sep() {
  return (
    <span aria-hidden="true" className="hidden sm:inline">
      ·
    </span>
  );
}

function plural(n: number, one: string, many = `${one}s`) {
  return `${n} ${n === 1 ? one : many}`;
}

/**
 * Applicants header: the pipeline in one line of numbers, Easy AI and CSV
 * export, and — only once a wait passes the 14-day target — the page-level
 * alarm. Shorter waits show on the job rows themselves.
 */
export default function ProApplicantsPageHeader({ summary, jobsWithApplicants, pipeline, overdue }: Props) {
  const quiet = summary.totalApplicants === 0;

  return (
    <div className="mb-6 flex flex-col gap-6">
      <PageHeader
        title="Applicants"
        description={
          quiet
            ? "Share a listing or browse talent. CSV export and Easy AI ranking are ready when applications land."
            : "Review, rank with Easy AI, and export the pipeline. Open a job to move people through stages."
        }
        meta={
          <>
            <span>
              <b className="num font-semibold text-eh-ink">{summary.totalApplicants}</b> total
            </span>
            <Sep />
            <span>
              <b className="num font-semibold text-eh-ink">{jobsWithApplicants}</b>{" "}
              {jobsWithApplicants === 1 ? "job" : "jobs"} with applicants
            </span>
            <Sep />
            <span>
              <b className="num font-semibold text-eh-ink">{pipeline.interview}</b> in interview
            </span>
            <Sep />
            <span>
              <b className="num font-semibold text-eh-ink">{pipeline.hired}</b> hired
            </span>
            {summary.needsReviewApplicants > 0 && (
              <>
                <Sep />
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
          <>
            <Button href="/employer/easy-ai" icon={<Sparkles />}>
              Easy AI
            </Button>
            {/* A plain anchor: the browser handles the CSV download itself. */}
            <Button href="/api/employer/exports/applicants" native icon={<Download />}>
              Export CSV
            </Button>
          </>
        }
      />

      {overdue && (
        <AttentionBanner
          tone="critical"
          title={
            overdue.jobCount === 1
              ? `An applicant on ${overdue.oldest.title} has waited ${plural(overdue.oldest.days, "day")}`
              : `${overdue.jobCount} jobs have applicants waiting over 14 days`
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
    </div>
  );
}
