import { Suspense } from "react";
import JobsBoard from "@/components/employer/JobsBoard";
import JobsPageHeader from "@/components/employer/JobsPageHeader";
import ProJobsPageHeader from "@/components/employer/pro-dashboard/ProJobsPageHeader";
import ProJobsBoard from "@/components/employer/pro-dashboard/ProJobsBoard";
import AttentionStrip from "@/components/employer/dashboard/AttentionStrip";
import { getJobsPageAttentionItems } from "@/lib/employer-jobs";
import { getEmployerJobsWithMetricsCached } from "@/lib/employer-cache";
import { requireEmployerPageContext } from "@/lib/employer-session";
import { proJobsPageView } from "@/lib/employer/job-card-state";
import JobListSkeleton from "@/components/employer/skeletons/JobListSkeleton";

export default async function EmployerJobsPage() {
  const { company, plan } = await requireEmployerPageContext();
  const isPro = plan === "PRO";
  const { jobs, summary } = await getEmployerJobsWithMetricsCached(company.id);
  const companyVerified = company.verifiedStatus === "APPROVED";
  const attentionItems = getJobsPageAttentionItems(summary);

  if (isPro) {
    const { now, overdue } = proJobsPageView(jobs, companyVerified);
    return (
      <>
        <ProJobsPageHeader
          summary={summary}
          companyVerified={companyVerified}
          overdue={overdue}
          // The needs-review count is already in the header and on the cards.
          reminders={attentionItems.filter((item) => item.id !== "needs-review")}
        />
        <Suspense fallback={<JobListSkeleton inline />}>
          <ProJobsBoard jobs={jobs} companyVerified={companyVerified} now={now} />
        </Suspense>
      </>
    );
  }

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
