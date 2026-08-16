import Link from "next/link";

import { ArrowRight, Briefcase, Star } from "lucide-react";

import type { EmployerAnalytics } from "@/lib/employer-analytics";

import { isJobCurrentlyFeatured } from "@/lib/jobs/featured";

import ProEmptyState from "@/components/employer/pro/ProEmptyState";



type Props = {

  jobs: EmployerAnalytics["activeJobs"];

  /** When true, renders as the primary operational block on the dashboard. */

  primary?: boolean;

};



export default function ProActiveJobsSection({ jobs, primary = false }: Props) {

  return (

    <section aria-labelledby="pro-active-jobs-heading">

      <div className="mb-4 flex items-end justify-between gap-3">

        <div>

          <h2

            id="pro-active-jobs-heading"

            className={`font-display font-bold tracking-tight text-ink ${primary ? "text-xl" : "text-2xl"}`}

          >

            Active jobs

          </h2>

          <p className="mt-0.5 text-sm text-ink/45">Roles currently open for applications</p>

        </div>

        <Link

          href="/employer/jobs"

          className="inline-flex items-center gap-1 text-sm font-semibold text-teal hover:underline"

        >

          View all

          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />

        </Link>

      </div>



      {jobs.length === 0 ? (

        <ProEmptyState

          icon={<Briefcase className="h-10 w-10" strokeWidth={1.5} />}

          title="No active jobs"

          description="Post a role to start receiving applications from verified virtual assistants."

          action={

            <Link

              href="/employer/jobs/new"

              className="inline-flex rounded-xl bg-marigold px-6 py-3 text-sm font-semibold text-ink shadow-sm shadow-marigold/20 transition hover:bg-marigold/90"

            >

              Post your first job

            </Link>

          }

        />

      ) : (

        <div className="overflow-hidden rounded-xl border border-ink/[0.06]">

          <ul className="divide-y divide-ink/[0.06]">

            {jobs.map((job) => {

              const featured = isJobCurrentlyFeatured(

                job.featuredUntil ? new Date(job.featuredUntil) : null

              );

              return (

                <li key={job.id}>

                  <Link

                    href={`/employer/jobs/${job.id}/applicants`}

                    className="group flex flex-col gap-2 bg-white/40 px-4 py-4 transition hover:bg-ink/[0.02] sm:flex-row sm:items-center sm:justify-between sm:px-5"

                  >

                    <div className="min-w-0">

                      <div className="flex flex-wrap items-center gap-2">

                        <p className="truncate text-base font-semibold text-ink group-hover:text-teal">

                          {job.title}

                        </p>

                        {featured && (

                          <span className="inline-flex items-center gap-1 rounded-full bg-teal/10 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-teal">

                            <Star className="h-3 w-3 fill-teal" strokeWidth={0} aria-hidden="true" />

                            Featured

                          </span>

                        )}

                      </div>

                      <p className="mt-0.5 text-sm text-ink/45">

                        {job.remoteType === "REMOTE" ? "Remote" : job.location}

                        {job.needsAttention && (

                          <span className="ml-2 font-medium text-ember">· Needs attention</span>

                        )}

                      </p>

                    </div>

                    <div className="flex shrink-0 items-center gap-4 text-sm">

                      <span className="text-ink/50">

                        <span className="font-data text-base font-semibold text-ink">

                          {job.applicantCount}

                        </span>{" "}

                        applicants

                      </span>

                      <span className="text-ink/50">

                        <span className="font-data text-base font-semibold text-ink">

                          {job.viewCount}

                        </span>{" "}

                        views

                      </span>

                      <ArrowRight

                        className="h-4 w-4 text-ink/25 group-hover:text-teal"

                        aria-hidden="true"

                      />

                    </div>

                  </Link>

                </li>

              );

            })}

          </ul>

        </div>

      )}

    </section>

  );

}

