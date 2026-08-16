"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import EmployerFilterChips from "@/components/employer/ui/EmployerFilterChips";
import EmployerEmptyState from "@/components/employer/ui/EmployerEmptyState";
import { EmployerPrimaryButton } from "@/components/employer/ui/EmployerPageHeader";
import ApplicantsHubToolbar, { type ApplicantsSortOption } from "@/components/employer/ApplicantsHubToolbar";
import ApplicantsHubRow from "@/components/employer/ApplicantsHubRow";
import type { EmployerJobCardData } from "@/lib/employer-jobs";
import { useEmployerShell } from "@/components/employer/EmployerShellContext";
import ProButton from "@/components/employer/pro/ProButton";
import ProEmptyState from "@/components/employer/pro/ProEmptyState";

type Props = {
  jobs: EmployerJobCardData[];
  companyVerified: boolean;
};

const FILTER_ALL = "ALL";
const FILTER_HAS_APPLICANTS = "HAS_APPLICANTS";
const FILTER_NEEDS_REVIEW = "NEEDS_REVIEW";
const FILTER_ACTIVE = "ACTIVE";

const VALID_FILTERS = new Set([
  FILTER_ALL,
  FILTER_HAS_APPLICANTS,
  FILTER_NEEDS_REVIEW,
  FILTER_ACTIVE,
]);

const EMPTY_COPY: Record<string, { title: string; description: string }> = {
  ALL: {
    title: "No jobs yet",
    description: "Post a job listing first — applications will appear here once seekers apply.",
  },
  HAS_APPLICANTS: {
    title: "No applications yet",
    description: "When seekers apply to your jobs, they'll show up here for review.",
  },
  NEEDS_REVIEW: {
    title: "All caught up",
    description: "No applicants are waiting in the Applied stage. Check back when new applications arrive.",
  },
  ACTIVE: {
    title: "No active job listings",
    description: "Publish or activate a job to start receiving applications.",
  },
};

const SEARCH_EMPTY = {
  title: "No jobs match your search",
  description: "Try a different keyword or clear the search to see all jobs.",
};

export default function ApplicantsHubBoard({ jobs, companyVerified }: Props) {
  const { isPro } = useEmployerShell();
  const searchParams = useSearchParams();
  const initialFilter = searchParams.get("filter") ?? FILTER_ALL;
  const [filter, setFilter] = useState(
    VALID_FILTERS.has(initialFilter) ? initialFilter : FILTER_ALL
  );
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<ApplicantsSortOption>(
    initialFilter === FILTER_NEEDS_REVIEW ? "review" : "updated"
  );

  const counts = useMemo(() => {
    let hasApplicants = 0;
    let needsReview = 0;
    let active = 0;
    for (const job of jobs) {
      if (job.applicantCount > 0) hasApplicants++;
      if (job.unreviewedCount > 0) needsReview++;
      if (job.status === "ACTIVE") active++;
    }
    return {
      ALL: jobs.length,
      HAS_APPLICANTS: hasApplicants,
      NEEDS_REVIEW: needsReview,
      ACTIVE: active,
    };
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    switch (filter) {
      case FILTER_HAS_APPLICANTS:
        return jobs.filter((j) => j.applicantCount > 0);
      case FILTER_NEEDS_REVIEW:
        return jobs.filter((j) => j.unreviewedCount > 0);
      case FILTER_ACTIVE:
        return jobs.filter((j) => j.status === "ACTIVE");
      default:
        return jobs;
    }
  }, [jobs, filter]);

  const displayedJobs = useMemo(() => {
    let list = filteredJobs;
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (j) =>
          j.title.toLowerCase().includes(q) ||
          j.location.toLowerCase().includes(q) ||
          (j.industry?.toLowerCase().includes(q) ?? false)
      );
    }
    return [...list].sort((a, b) => {
      if (sort === "applicants") return b.applicantCount - a.applicantCount;
      if (sort === "review") {
        if (a.unreviewedCount !== b.unreviewedCount) return b.unreviewedCount - a.unreviewedCount;
        return b.applicantCount - a.applicantCount;
      }
      if (sort === "title") return a.title.localeCompare(b.title);
      if (isPro) {
        if (a.unreviewedCount !== b.unreviewedCount) return b.unreviewedCount - a.unreviewedCount;
        if (a.applicantCount !== b.applicantCount) return b.applicantCount - a.applicantCount;
      }
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [filteredJobs, query, sort, isPro]);

  const filterOptions = [
    { value: FILTER_ALL, label: "All jobs", count: counts.ALL },
    { value: FILTER_HAS_APPLICANTS, label: "Has applicants", count: counts.HAS_APPLICANTS },
    { value: FILTER_NEEDS_REVIEW, label: "Needs review", count: counts.NEEDS_REVIEW },
    { value: FILTER_ACTIVE, label: "Active", count: counts.ACTIVE },
  ];

  if (jobs.length === 0) {
    if (isPro) {
      return (
        <ProEmptyState
          title="Post a job to start a pipeline"
          description="Applications land here. Export CSV and rank with Easy AI once seekers apply."
          action={
            <ProButton href="/employer/jobs/new" variant="primary">
              <Plus className="h-4 w-4" />
              Post a job
            </ProButton>
          }
        />
      );
    }
    return (
      <EmployerEmptyState
        title={EMPTY_COPY.ALL.title}
        description={EMPTY_COPY.ALL.description}
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
      <EmployerFilterChips options={filterOptions} value={filter} onChange={setFilter} />
      <ApplicantsHubToolbar
        query={query}
        onQueryChange={setQuery}
        sort={sort}
        onSortChange={setSort}
        resultCount={displayedJobs.length}
      />

      {displayedJobs.length === 0 ? (
        isPro ? (
          <ProEmptyState
            compact
            title={query.trim() ? SEARCH_EMPTY.title : (EMPTY_COPY[filter]?.title ?? "No jobs found")}
            description={
              query.trim()
                ? SEARCH_EMPTY.description
                : (EMPTY_COPY[filter]?.description ?? "Try a different filter.")
            }
            action={
              filter === FILTER_ALL && !query.trim() ? (
                <ProButton href="/employer/jobs/new" variant="primary">
                  <Plus className="h-4 w-4" />
                  Post a job
                </ProButton>
              ) : filter === FILTER_HAS_APPLICANTS && !query.trim() ? (
                <ProButton href="/employer/jobs" variant="secondary">
                  View job listings
                </ProButton>
              ) : filter === FILTER_NEEDS_REVIEW && !query.trim() ? (
                <ProButton href="/employer/talent" variant="primary">
                  Browse talent
                </ProButton>
              ) : undefined
            }
          />
        ) : (
          <EmployerEmptyState
            title={query.trim() ? SEARCH_EMPTY.title : (EMPTY_COPY[filter]?.title ?? "No jobs found")}
            description={
              query.trim()
                ? SEARCH_EMPTY.description
                : (EMPTY_COPY[filter]?.description ?? "Try a different filter.")
            }
            action={
              filter === FILTER_ALL && !query.trim() ? (
                <EmployerPrimaryButton href="/employer/jobs/new">
                  <Plus className="h-4 w-4" />
                  Post a job
                </EmployerPrimaryButton>
              ) : filter === FILTER_HAS_APPLICANTS && !query.trim() ? (
                <EmployerPrimaryButton href="/employer/jobs">View job listings</EmployerPrimaryButton>
              ) : undefined
            }
          />
        )
      ) : isPro ? (
        <div className="flex flex-col gap-3">
          {displayedJobs.map((job, i) => (
            <ApplicantsHubRow
              key={job.id}
              job={job}
              companyVerified={companyVerified}
              index={i}
              variant="pro"
            />
          ))}
        </div>
      ) : (
        <div className="-mx-2 border-t border-ink/5">
          {displayedJobs.map((job, i) => (
            <ApplicantsHubRow
              key={job.id}
              job={job}
              companyVerified={companyVerified}
              index={i}
            />
          ))}
        </div>
      )}
    </>
  );
}
