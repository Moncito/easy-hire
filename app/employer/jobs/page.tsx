import Link from "next/link";
import { auth } from "@/Auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import JobList from "@/components/employer/JobList";

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

  // Fetch all jobs with applicant count
  const jobs = await prisma.job.findMany({
    where: { companyId: company.id },
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { applications: true },
      },
    },
  });

  return (
    <>
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink tracking-tight">Job Postings</h1>
          <p className="mt-1.5 text-sm text-ink/50">
            Manage your job listings, track applicant counts, and hire the right virtual assistants.
          </p>
        </div>
        
        <Link
          href="/employer/jobs/new"
          className="flex items-center gap-2 rounded-xl bg-teal px-5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-teal/95 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          Post a new job
        </Link>
      </div>

      <JobList jobs={JSON.parse(JSON.stringify(jobs))} />
    </>
  );
}