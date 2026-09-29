import Link from "next/link";
import { ArrowRight, ExternalLink, Plus } from "lucide-react";

import type { EmployerAnalytics } from "@/lib/employer-analytics";
import { canViewPublicListing, getJobPrimaryAction, jobStatusDisplay } from "@/lib/employer-jobs";
import ProButton from "@/components/employer/pro/ProButton";
import ProEmptyState from "@/components/employer/pro/ProEmptyState";

type Job = EmployerAnalytics["activeJobs"][number];

type Props = {
  jobs: Job[];
  companyVerified: boolean;
  showPostAnother?: boolean;
};

function splitTitle(title: string) {
  const pipe = title.indexOf(" | ");
  return pipe === -1 ? title : title.slice(0, pipe);
}

export default function ProJobsTable({ jobs, companyVerified, showPostAnother = false }: Props) {
  const sorted = [...jobs].sort(
    (a, b) => b.applicantCount - a.applicantCount || b.viewCount - a.viewCount
  );

  return (
    <section aria-labelledby="pro-jobs-heading">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h2 id="pro-jobs-heading" className="text-base font-semibold text-ink">
            Active roles
          </h2>
          <p className="mt-0.5 text-sm text-ink/45">Most active first.</p>
        </div>
        <Link
          href="/employer/jobs"
          className="inline-flex items-center gap-1 text-sm font-semibold text-ink/55 transition hover:text-ink"
        >
          All jobs
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>

      {sorted.length === 0 ? (
        <ProEmptyState
          compact
          title="No active roles"
          description="Post a listing and this table fills with views, applicants, and hires."
          action={
            <ProButton href="/employer/jobs/new" variant="primary">
              Post a job
            </ProButton>
          }
        />
      ) : (
        <div className="pro-card overflow-hidden !p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-ink/[0.06] text-xs font-medium text-ink/50">
                  <th className="px-5 py-3 font-medium">Role</th>
                  <th className="px-3 py-3 text-right font-medium">Views</th>
                  <th className="px-3 py-3 text-right font-medium">Applicants</th>
                  <th className="px-3 py-3 text-right font-medium">Hired</th>
                  <th className="px-5 py-3 text-right font-medium"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((job) => {
                  const status = jobStatusDisplay(job, companyVerified);
                  const action = getJobPrimaryAction(
                    { id: job.id, status: job.status, unreviewedCount: job.needsAttention ? 1 : 0 },
                    companyVerified
                  );
                  const shareable = canViewPublicListing(job, companyVerified);
                  const quiet = job.applicantCount === 0;

                  return (
                    <tr key={job.id} className="border-b border-ink/[0.04] last:border-0">
                      <td className="px-5 py-3.5">
                        <Link
                          href={action.href}
                          className="group block max-w-[280px]"
                          title={job.title}
                        >
                          <span className="line-clamp-1 font-semibold text-ink transition group-hover:text-[#9A5B12]">
                            {splitTitle(job.title)}
                          </span>
                        </Link>
                        <p className="mt-0.5 line-clamp-1 text-xs text-ink/40">
                          {job.location} · {job.remoteType.replaceAll("_", " ").toLowerCase()}
                        </p>
                        <span className="mt-1 inline-block rounded-full bg-ink/[0.06] px-2 py-0.5 text-[11px] font-medium text-ink/60">
                          {status.label}
                        </span>
                        {quiet && (
                          <p className="mt-1.5 text-xs text-ink/45">
                            {job.viewCount === 0 ? (
                              <>
                                Not getting seen —{" "}
                                {shareable ? (
                                  <Link href={`/jobs/${job.id}`} className="font-semibold text-[#9A5B12] hover:underline">
                                    share listing
                                  </Link>
                                ) : (
                                  <Link
                                    href={`/employer/jobs/${job.id}/edit`}
                                    className="font-semibold text-[#9A5B12] hover:underline"
                                  >
                                    refresh listing
                                  </Link>
                                )}
                              </>
                            ) : (
                              <>
                                No applicants yet —{" "}
                                {shareable ? (
                                  <Link href={`/jobs/${job.id}`} className="font-semibold text-[#9A5B12] hover:underline">
                                    share listing
                                  </Link>
                                ) : (
                                  <Link
                                    href={`/employer/jobs/${job.id}/edit`}
                                    className="font-semibold text-[#9A5B12] hover:underline"
                                  >
                                    polish listing
                                  </Link>
                                )}
                              </>
                            )}
                          </p>
                        )}
                      </td>
                      <td className="px-3 py-3.5 text-right font-data font-bold text-ink">{job.viewCount}</td>
                      <td className="px-3 py-3.5 text-right font-data font-bold text-ink">{job.applicantCount}</td>
                      <td className="px-3 py-3.5 text-right font-data text-sm text-ink/70">
                        {job.hiredCount}/{job.targetHireCount}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={action.href}
                            className="rounded-lg px-2 py-1 text-sm font-semibold text-[#9A5B12] transition hover:bg-marigold/10"
                          >
                            {action.label}
                          </Link>
                          {shareable && (
                            <Link
                              href={`/jobs/${job.id}`}
                              className="rounded-lg p-1.5 text-ink/40 transition hover:bg-ink/[0.05] hover:text-ink"
                              aria-label={`Open public listing for ${job.title}`}
                              title="Public listing"
                            >
                              <ExternalLink className="h-4 w-4" aria-hidden="true" />
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {showPostAnother && (
            <Link
              href="/employer/jobs/new"
              className="flex items-center justify-center gap-2 border-t border-ink/[0.06] px-5 py-3.5 text-sm font-semibold text-ink/60 transition hover:bg-ink/[0.02] hover:text-ink"
            >
              <Plus className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
              Post another role
            </Link>
          )}
        </div>
      )}
    </section>
  );
}
