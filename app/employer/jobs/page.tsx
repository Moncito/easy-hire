import { Suspense } from "react";
import { redirect } from "next/navigation";
import JobsBoard from "@/components/employer/JobsBoard";
import JobsPageHeader from "@/components/employer/JobsPageHeader";
import AttentionStrip from "@/components/employer/dashboard/AttentionStrip";
import {
  getJobsPageAttentionItems,
} from "@/lib/employer-jobs";
import { getEmployerJobsWithMetricsCached } from "@/lib/employer-cache";
import { requireEmployerPageContext } from "@/lib/employer-session";
import JobListSkeleton from "@/components/employer/skeletons/JobListSkeleton";

export default async function EmployerJobsPage() {
  const { company } = await requireEmployerPageContext();
  const { jobs, summary } = await getEmployerJobsWithMetricsCached(company.id);
  const companyVerified = company.verifiedStatus === "APPROVED";
  const attentionItems = getJobsPageAttentionItems(summary);

  return (
    <>
      <JobsPageHeader summary={summary} />
      {attentionItems.length > 0 && <AttentionStrip items={attentionItems} />}
      <Suspense fallback={<JobListSkeleton inline />}>
        <JobsBoard jobs={jobs} companyVerified={companyVerified} />
      </Suspense>
    </>
  );
}
