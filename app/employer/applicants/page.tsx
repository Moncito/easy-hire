import { redirect } from "next/navigation";
import ApplicantsPageHeader from "@/components/employer/ApplicantsPageHeader";
import ApplicantsHubBoard from "@/components/employer/ApplicantsHubBoard";
import AttentionStrip from "@/components/employer/dashboard/AttentionStrip";
import {
  getEmployerJobsWithMetrics,
  getApplicantsPageAttentionItems,
} from "@/lib/employer-jobs";
import ApplicantsHubSkeleton from "@/components/employer/skeletons/ApplicantsHubSkeleton";
import { requireEmployerLayoutContext } from "@/lib/employer-session";
import { Suspense } from "react";

export default async function EmployerApplicantsPage() {
  const ctx = await requireEmployerLayoutContext();

  if (!ctx) {
    redirect("/login");
  }

  const { company } = ctx;

  if (!company) {
    redirect("/employer/company-profile");
  }

  const { jobs, summary } = await getEmployerJobsWithMetrics(company.id);
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
