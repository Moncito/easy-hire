import Link from "next/link";
import { auth } from "@/Auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import JobList from "@/components/employer/JobList";
import { EmployerPrimaryButton } from "@/components/employer/ui/EmployerPageHeader";

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

  const jobs = await prisma.job.findMany({
    where: { companyId: company.id },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { applications: true } },
      screeningQuestions: {
        orderBy: { sortOrder: "asc" },
        select: { prompt: true, required: true },
      },
    },
  });

  const companyVerified = company.verifiedStatus === "APPROVED";

  return (
    <>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <p className="max-w-xl text-sm text-ink/50">
          Manage listings, filter by status, and open the applicant pipeline for any job.
        </p>
        <EmployerPrimaryButton href="/employer/jobs/new">
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          Post a new job
        </EmployerPrimaryButton>
      </div>

      <JobList jobs={JSON.parse(JSON.stringify(jobs))} companyVerified={companyVerified} />
    </>
  );
}
