import { redirect } from "next/navigation";
import ApplicantsBoard from "@/components/employer/ApplicantsBoard";
import { requireEmployerPageContext } from "@/lib/employer-session";
import { listJobApplications } from "@/lib/applications";
import { getEmployerJobForApplicants } from "@/lib/employer-jobs";

const PAGE_SIZE = 50;

export default async function ApplicantsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { company } = await requireEmployerPageContext();
  const { id } = await params;
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const job = await getEmployerJobForApplicants(company.id, id);

  if (!job) {
    redirect("/employer/jobs");
  }

  const { applications, total, totalPages } = await listJobApplications(job.id, page, PAGE_SIZE);

  const staleThreshold = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
  const unreviewedStale = applications.filter(
    (a) => a.status === "APPLIED" && a.appliedAt < staleThreshold
  ).length;
  const needsAttention = unreviewedStale > 0;
  const companyVerified = company?.verifiedStatus === "APPROVED";

  return (
    <>
      {total > PAGE_SIZE && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-ink/45">
          <p>
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}{" "}
            applicants
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <a
                href={`/employer/jobs/${job.id}/applicants?page=${page - 1}`}
                className="font-medium text-teal hover:underline"
              >
                Previous
              </a>
            )}
            {page < totalPages && (
              <a
                href={`/employer/jobs/${job.id}/applicants?page=${page + 1}`}
                className="font-medium text-teal hover:underline"
              >
                Next
              </a>
            )}
          </div>
        </div>
      )}
      <ApplicantsBoard
        job={{
          id: job.id,
          title: job.title,
          status: job.status,
          employmentType: job.employmentType,
          remoteType: job.remoteType,
          location: job.location,
          salaryMin: job.salaryMin,
          salaryMax: job.salaryMax,
          salaryPeriod: job.salaryPeriod,
          createdAt: job.createdAt.toISOString(),
          targetHireCount: job.targetHireCount,
        }}
        companyVerified={companyVerified}
        needsAttention={needsAttention}
        employerName={company?.companyName ?? "Team"}
        initialApplications={JSON.parse(JSON.stringify(applications))}
      />
    </>
  );
}
