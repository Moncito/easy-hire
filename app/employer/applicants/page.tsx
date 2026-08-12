import { Suspense } from "react";
import { redirect } from "next/navigation";
import ApplicantsPageHeader from "@/components/employer/ApplicantsPageHeader";
import ApplicantsHubBoard from "@/components/employer/ApplicantsHubBoard";
import AttentionStrip from "@/components/employer/dashboard/AttentionStrip";
import {
  getApplicantsPageAttentionItems,
} from "@/lib/employer-jobs";
import { getEmployerJobsWithMetricsCached } from "@/lib/employer-cache";
import { requireEmployerPageContext } from "@/lib/employer-session";
import ApplicantsHubSkeleton from "@/components/employer/skeletons/ApplicantsHubSkeleton";

export default async function EmployerApplicantsPage() {
  const { company } = await requireEmployerPageContext();
  const { jobs, summary } = await getEmployerJobsWithMetricsCached(company.id);
  const companyVerified = company.verifiedStatus === "APPROVED";
  const jobsWithApplicants = jobs.filter((j) => j.applicantCount > 0).length;
  const attentionItems = getApplicantsPageAttentionItems(jobs);

  return (
    <>
      <ApplicantsPageHeader summary={summary} jobsWithApplicants={jobsWithApplicants} />
      {attentionItems.length > 0 && <AttentionStrip items={attentionItems} />}
      <Suspense fallback={<ApplicantsHubSkeleton inline />}>
        <ApplicantsHubBoard jobs={jobs} companyVerified={companyVerified} />
      </Suspense>
    </>
  );
}
