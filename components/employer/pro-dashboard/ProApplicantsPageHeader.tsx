import Link from "next/link";
import { Sparkles } from "lucide-react";
import ProPageHeader from "@/components/employer/pro-dashboard/ProPageHeader";
import ProApplicantsPerkStrip from "@/components/employer/pro-dashboard/ProApplicantsPerkStrip";
import ProButton from "@/components/employer/pro/ProButton";
import ExportCsvLink from "@/components/employer/ui/ExportCsvLink";
import type { EmployerJobsSummary } from "@/lib/employer-jobs";

type PipelineTotals = {
  interview: number;
  hired: number;
};

type Props = {
  summary: EmployerJobsSummary;
  jobsWithApplicants: number;
  pipeline: PipelineTotals;
};

export default function ProApplicantsPageHeader({
  summary,
  jobsWithApplicants,
  pipeline,
}: Props) {
  const quiet = summary.totalApplicants === 0;

  return (
    <>
      <ProPageHeader
        title="Applicants"
        description={
          quiet
            ? "Share a listing or browse talent. CSV export and Easy AI ranking are ready when applications land."
            : "Review, rank with Easy AI, and export the pipeline. Open a job to move people through stages."
        }
        stats={
          <>
            <span>
              <span className="font-data font-semibold text-ink">{summary.totalApplicants}</span>{" "}
              total
            </span>
            <span>
              <span className="font-data font-semibold text-ink">{jobsWithApplicants}</span>{" "}
              {jobsWithApplicants === 1 ? "job" : "jobs"} with applicants
            </span>
            <span>
              <span className="font-data font-semibold text-ink">{pipeline.interview}</span> in
              interview
            </span>
            <span>
              <span className="font-data font-semibold text-ink">{pipeline.hired}</span> hired
            </span>
            {summary.needsReviewApplicants > 0 && (
              <Link
                href="/employer/applicants?filter=NEEDS_REVIEW"
                className="font-semibold text-[#9A5B12] hover:underline"
              >
                {summary.needsReviewApplicants} need review
              </Link>
            )}
          </>
        }
        actions={
          <>
            <ProButton href="/employer/easy-ai" variant="secondary" icon={<Sparkles className="h-4 w-4" strokeWidth={2.25} />}>
              Easy AI
            </ProButton>
            <ExportCsvLink />
          </>
        }
      />
      <ProApplicantsPerkStrip />
    </>
  );
}
