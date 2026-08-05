import { auth } from "@/Auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import EmployerListRow from "@/components/employer/ui/EmployerListRow";
import EmployerPipelineBar from "@/components/employer/ui/EmployerPipelineBar";
import EmployerEmptyState from "@/components/employer/ui/EmployerEmptyState";
import { EmployerPrimaryButton } from "@/components/employer/ui/EmployerPageHeader";

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

  const jobs = await prisma.job.findMany({
    where: { companyId: company.id },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { applications: true } },
    },
  });

  const jobIds = jobs.map((j) => j.id);
  const pipelineGroups =
    jobIds.length > 0
      ? await prisma.application.groupBy({
          by: ["jobId", "status"],
          where: { jobId: { in: jobIds } },
          _count: { _all: true },
        })
      : [];

  const pipelineByJob = new Map<
    string,
    { applied: number; shortlisted: number; interview: number; hired: number }
  >();

  for (const job of jobs) {
    pipelineByJob.set(job.id, { applied: 0, shortlisted: 0, interview: 0, hired: 0 });
  }

  for (const row of pipelineGroups) {
    const bucket = pipelineByJob.get(row.jobId);
    if (!bucket) continue;
    const n = row._count._all;
    if (row.status === "APPLIED") bucket.applied = n;
    else if (row.status === "SHORTLISTED") bucket.shortlisted = n;
    else if (row.status === "INTERVIEW") bucket.interview = n;
    else if (row.status === "HIRED") bucket.hired = n;
  }

  return (
    <>
      <p className="mb-8 max-w-xl text-sm text-ink/50">
        Select a job to open its Kanban pipeline. Bars show how applicants are distributed
        across stages.
      </p>

      {jobs.length === 0 ? (
        <EmployerEmptyState
          title="No jobs yet"
          description="Post a job listing first — applications will appear here once seekers apply."
          action={
            <EmployerPrimaryButton href="/employer/jobs/new">
              <Plus className="h-4 w-4" />
              Post a job
            </EmployerPrimaryButton>
          }
        />
      ) : (
        <div className="divide-y divide-ink/5 overflow-hidden rounded-2xl border border-ink/5 bg-white/60 shadow-sm">
          {jobs.map((job) => {
            const pipeline = pipelineByJob.get(job.id)!;
            return (
              <EmployerListRow
                key={job.id}
                href={`/employer/jobs/${job.id}/applicants`}
                title={job.title}
                subtitle={`${job.location} · ${job.employmentType.replace("_", " ")}`}
                meta={
                  <span className="font-data text-sm font-semibold tabular-nums text-ink">
                    {job._count.applications}{" "}
                    <span className="font-normal text-ink/45">applicants</span>
                  </span>
                }
                pipeline={<EmployerPipelineBar {...pipeline} />}
              />
            );
          })}
        </div>
      )}
    </>
  );
}
