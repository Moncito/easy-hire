"use client";

import { Plus } from "lucide-react";
import EmployerFilterChips from "@/components/employer/ui/EmployerFilterChips";
import EmployerEmptyState from "@/components/employer/ui/EmployerEmptyState";
import { EmployerPrimaryButton } from "@/components/employer/ui/EmployerPageHeader";
import ApplicantsHubToolbar from "@/components/employer/ApplicantsHubToolbar";
import ApplicantsHubRow from "@/components/employer/ApplicantsHubRow";
import type { EmployerJobCardData } from "@/lib/employer-jobs";
import {
  HUB_EMPTY_COPY,
  HUB_FILTER_ALL,
  HUB_FILTER_HAS_APPLICANTS,
  HUB_SEARCH_EMPTY,
  useApplicantsHub,
} from "@/components/employer/jobs/useApplicantsHub";

type Props = {
  jobs: EmployerJobCardData[];
  companyVerified: boolean;
};

/** The Free plan's Applicants hub. Pro renders ProApplicantsHubBoard instead. */
export default function ApplicantsHubBoard({ jobs, companyVerified }: Props) {
  const hub = useApplicantsHub(jobs);
  const { displayedJobs, filter, query } = hub;

  if (jobs.length === 0) {
    return (
      <EmployerEmptyState
        title={HUB_EMPTY_COPY.ALL.title}
        description={HUB_EMPTY_COPY.ALL.description}
        action={
          <EmployerPrimaryButton href="/employer/jobs/new">
            <Plus className="h-4 w-4" />
            Post a job
          </EmployerPrimaryButton>
        }
      />
    );
  }

  return (
    <>
      <EmployerFilterChips options={hub.filterOptions} value={filter} onChange={hub.setFilter} />
      <ApplicantsHubToolbar
        query={query}
        onQueryChange={hub.setQuery}
        sort={hub.sort}
        onSortChange={hub.setSort}
        resultCount={displayedJobs.length}
      />

      {displayedJobs.length === 0 ? (
        <EmployerEmptyState
          title={query.trim() ? HUB_SEARCH_EMPTY.title : (HUB_EMPTY_COPY[filter]?.title ?? "No jobs found")}
          description={
            query.trim() ? HUB_SEARCH_EMPTY.description : (HUB_EMPTY_COPY[filter]?.description ?? "Try a different filter.")
          }
          action={
            filter === HUB_FILTER_ALL && !query.trim() ? (
              <EmployerPrimaryButton href="/employer/jobs/new">
                <Plus className="h-4 w-4" />
                Post a job
              </EmployerPrimaryButton>
            ) : filter === HUB_FILTER_HAS_APPLICANTS && !query.trim() ? (
              <EmployerPrimaryButton href="/employer/jobs">View job listings</EmployerPrimaryButton>
            ) : undefined
          }
        />
      ) : (
        <div className="-mx-2 border-t border-ink/5">
          {displayedJobs.map((job, i) => (
            <ApplicantsHubRow key={job.id} job={job} companyVerified={companyVerified} index={i} />
          ))}
        </div>
      )}
    </>
  );
}
