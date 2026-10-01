"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { EmployerJobCardData } from "@/lib/employer-jobs";

export type ApplicantsSortOption = "updated" | "applicants" | "review" | "title";

export const HUB_FILTER_ALL = "ALL";
export const HUB_FILTER_HAS_APPLICANTS = "HAS_APPLICANTS";
export const HUB_FILTER_NEEDS_REVIEW = "NEEDS_REVIEW";
export const HUB_FILTER_ACTIVE = "ACTIVE";

const VALID_FILTERS = new Set([HUB_FILTER_ALL, HUB_FILTER_HAS_APPLICANTS, HUB_FILTER_NEEDS_REVIEW, HUB_FILTER_ACTIVE]);

export const HUB_EMPTY_COPY: Record<string, { title: string; description: string }> = {
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

export const HUB_SEARCH_EMPTY = {
  title: "No jobs match your search",
  description: "Try a different keyword or clear the search to see all jobs.",
};

/**
 * Filter (seeded from `?filter=`), search and sort for the Applicants hub —
 * the list of jobs with their pipelines. Shared by the Free and Pro boards.
 * `waitingFirst` is Pro's default ordering: jobs with unreviewed
 * applicants, then the busiest, before recency.
 */
export function useApplicantsHub(jobs: EmployerJobCardData[], { waitingFirst = false } = {}) {
  const searchParams = useSearchParams();
  const initialFilter = searchParams.get("filter") ?? HUB_FILTER_ALL;
  const [filter, setFilter] = useState(VALID_FILTERS.has(initialFilter) ? initialFilter : HUB_FILTER_ALL);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<ApplicantsSortOption>(
    initialFilter === HUB_FILTER_NEEDS_REVIEW ? "review" : "updated"
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
    return { ALL: jobs.length, HAS_APPLICANTS: hasApplicants, NEEDS_REVIEW: needsReview, ACTIVE: active };
  }, [jobs]);

  const displayedJobs = useMemo(() => {
    let list =
      filter === HUB_FILTER_HAS_APPLICANTS
        ? jobs.filter((j) => j.applicantCount > 0)
        : filter === HUB_FILTER_NEEDS_REVIEW
          ? jobs.filter((j) => j.unreviewedCount > 0)
          : filter === HUB_FILTER_ACTIVE
            ? jobs.filter((j) => j.status === "ACTIVE")
            : jobs;
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
      if (waitingFirst) {
        if (a.unreviewedCount !== b.unreviewedCount) return b.unreviewedCount - a.unreviewedCount;
        if (a.applicantCount !== b.applicantCount) return b.applicantCount - a.applicantCount;
      }
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [jobs, filter, query, sort, waitingFirst]);

  const filterOptions = [
    { value: HUB_FILTER_ALL, label: "All jobs", count: counts.ALL },
    { value: HUB_FILTER_HAS_APPLICANTS, label: "Has applicants", count: counts.HAS_APPLICANTS },
    { value: HUB_FILTER_NEEDS_REVIEW, label: "Needs review", count: counts.NEEDS_REVIEW },
    { value: HUB_FILTER_ACTIVE, label: "Active", count: counts.ACTIVE },
  ];

  return { displayedJobs, filter, setFilter, filterOptions, query, setQuery, sort, setSort };
}
