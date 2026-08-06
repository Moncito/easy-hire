import { Suspense } from "react";
import { auth } from "@/Auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import JobsBoard from "@/components/employer/JobsBoard";
import JobsPageHeader from "@/components/employer/JobsPageHeader";
import AttentionStrip from "@/components/employer/dashboard/AttentionStrip";
import {
  getEmployerJobsWithMetrics,
  getJobsPageAttentionItems,
} from "@/lib/employer-jobs";
import JobListSkeleton from "@/components/employer/skeletons/JobListSkeleton";

export default async function EmployerJobsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const company = await prisma.company.findUnique({
    where: { userId: session.user.id },
  });

  if (!company) {
    redirect("/employer/company-profile");
  }

  const { jobs, summary } = await getEmployerJobsWithMetrics(company.id);
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
