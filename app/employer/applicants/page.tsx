import { auth } from "@/Auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Users, Briefcase, ChevronRight, ArrowRight } from "lucide-react";

export default async function EmployerApplicantsPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "EMPLOYER") {
    redirect("/login");
  }

  const company = await prisma.company.findUnique({
    where: { userId: session.user.id },
  });

  if (!company) {
    redirect("/employer/company-profile");
  }

  // Fetch jobs and their applications count
  const jobs = await prisma.job.findMany({
    where: { companyId: company.id },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: {
        select: { applications: true },
      },
    },
  });

  return (
    <>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-ink tracking-tight">Applicants</h1>
        <p className="mt-1.5 text-sm text-ink/50">
          Select a job posting below to view and manage candidate stages in the pipeline.
        </p>
      </div>

      {jobs.length === 0 ? (
        <div className="rounded-3xl border border-ink/5 bg-white p-12 text-center shadow-xs">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-teal/5 text-teal">
            <Users className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-semibold text-ink">No applicants yet</h3>
          <p className="mt-1 text-xs text-ink/50 max-w-xs mx-auto">
            You need to create a job listing first before you can receive applications.
          </p>
          <Link
            href="/employer/jobs/new"
            className="mt-5 inline-block rounded-xl bg-teal px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-teal/95"
          >
            Post a new job
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {jobs.map((job) => (
            <Link
              key={job.id}
              href={`/employer/jobs/${job.id}/applicants`}
              className="group flex items-center justify-between rounded-2xl border border-ink/5 bg-white p-5 shadow-xs hover:shadow-md hover:border-ink/10 transition-all duration-300"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal/5 text-teal group-hover:bg-teal group-hover:text-white transition-colors">
                  <Briefcase className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-ink transition-colors group-hover:text-teal">
                    {job.title}
                  </h3>
                  <p className="text-xs text-ink/50 mt-1">
                    {job.location} &bull; {job.employmentType.replace("_", " ")}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className="block font-display text-lg font-bold text-ink leading-tight">
                    {job._count.applications}
                  </span>
                  <span className="text-[10px] text-ink/40 font-medium uppercase tracking-wider">
                    Candidates
                  </span>
                </div>
                <ChevronRight className="h-5 w-5 text-ink/30 group-hover:text-teal transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
