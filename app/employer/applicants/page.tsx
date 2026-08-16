import { Suspense } from "react";
import ApplicantsPageHeader from "@/components/employer/ApplicantsPageHeader";
import ProApplicantsPageHeader from "@/components/employer/pro-dashboard/ProApplicantsPageHeader";
import ProAttentionLinks from "@/components/employer/pro-dashboard/ProAttentionLinks";
import ApplicantsHubBoard from "@/components/employer/ApplicantsHubBoard";
import AttentionStrip from "@/components/employer/dashboard/AttentionStrip";
import { getApplicantsPageAttentionItems } from "@/lib/employer-jobs";
import { getEmployerJobsWithMetricsCached } from "@/lib/employer-cache";
import { requireEmployerPageContext } from "@/lib/employer-session";
import ApplicantsHubSkeleton from "@/components/employer/skeletons/ApplicantsHubSkeleton";

export default async function EmployerApplicantsPage() {
  const { company, plan } = await requireEmployerPageContext();
  const isPro = plan === "PRO";
  const { jobs, summary } = await getEmployerJobsWithMetricsCached(company.id);
  const companyVerified = company.verifiedStatus === "APPROVED";
  const jobsWithApplicants = jobs.filter((j) => j.applicantCount > 0).length;
  const attentionItems = getApplicantsPageAttentionItems(jobs);
  const pipeline = jobs.reduce(
    (acc, job) => ({
      interview: acc.interview + job.pipeline.interview,
      hired: acc.hired + job.pipeline.hired,
    }),
    { interview: 0, hired: 0 }
  );

  return (
    <>
      {isPro ? (
        <>
          <ProApplicantsPageHeader
            summary={summary}
            jobsWithApplicants={jobsWithApplicants}
            pipeline={pipeline}
          />
          <ProAttentionLinks items={attentionItems} />
        </>
      ) : (
        <>
          <ApplicantsPageHeader summary={summary} jobsWithApplicants={jobsWithApplicants} />
          {attentionItems.length > 0 && <AttentionStrip items={attentionItems} />}
        </>
      )}
      <Suspense fallback={<ApplicantsHubSkeleton inline />}>
        <ApplicantsHubBoard jobs={jobs} companyVerified={companyVerified} />
      </Suspense>
    </>
  );
}
