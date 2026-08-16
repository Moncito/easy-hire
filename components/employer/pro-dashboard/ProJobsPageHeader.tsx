import { Plus } from "lucide-react";
import ProPageHeader from "@/components/employer/pro-dashboard/ProPageHeader";
import ProJobsPerkStrip from "@/components/employer/pro-dashboard/ProJobsPerkStrip";
import ProButton from "@/components/employer/pro/ProButton";
import type { EmployerJobsSummary } from "@/lib/employer-jobs";
import Link from "next/link";

type Props = {
  summary: EmployerJobsSummary;
  companyVerified: boolean;
};

export default function ProJobsPageHeader({ summary, companyVerified }: Props) {
  return (
    <>
      <ProPageHeader
        title="Job postings"
        description={
          companyVerified
            ? "Verified Pro — new listings go live instantly. Unlimited roles, feature any job."
            : "Unlimited roles and featured listings. Finish verification to skip the admin publish queue."
        }
        stats={
          <>
            <span>
              <span className="font-data font-semibold text-ink">{summary.total}</span> total
            </span>
            <span>
              <span className="font-data font-semibold text-ink">{summary.active}</span> active
            </span>
            <span>
              <span className="font-data font-semibold text-ink">{summary.totalApplicants}</span>{" "}
              applicants
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
          <ProButton
            href="/employer/jobs/new"
            variant="primary"
            icon={<Plus className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />}
          >
            Post a new job
          </ProButton>
        }
      />
      <ProJobsPerkStrip companyVerified={companyVerified} />
    </>
  );
}
