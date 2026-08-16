import { Suspense } from "react";
import JobsBoard from "@/components/employer/JobsBoard";
import JobsPageHeader from "@/components/employer/JobsPageHeader";
import ProJobsPageHeader from "@/components/employer/pro-dashboard/ProJobsPageHeader";
import ProAttentionLinks from "@/components/employer/pro-dashboard/ProAttentionLinks";
import AttentionStrip from "@/components/employer/dashboard/AttentionStrip";
import { getJobsPageAttentionItems } from "@/lib/employer-jobs";
import { getEmployerJobsWithMetricsCached } from "@/lib/employer-cache";
import { requireEmployerPageContext } from "@/lib/employer-session";
import JobListSkeleton from "@/components/employer/skeletons/JobListSkeleton";

export default async function EmployerJobsPage() {
  const { company, plan } = await requireEmployerPageContext();
  const isPro = plan === "PRO";
  const { jobs, summary } = await getEmployerJobsWithMetricsCached(company.id);
  const companyVerified = company.verifiedStatus === "APPROVED";
  const attentionItems = getJobsPageAttentionItems(summary);

  return (
    <>
      {isPro ? (
        <>
          <ProJobsPageHeader summary={summary} companyVerified={companyVerified} />
          <ProAttentionLinks items={attentionItems} />
        </>
      ) : (
        <>
          <JobsPageHeader summary={summary} />
          {attentionItems.length > 0 && <AttentionStrip items={attentionItems} />}
        </>
      )}
      <Suspense fallback={<JobListSkeleton inline />}>
        <JobsBoard jobs={jobs} companyVerified={companyVerified} />
      </Suspense>
    </>
  );
}
