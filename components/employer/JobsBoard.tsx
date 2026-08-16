"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import EmployerFilterChips from "@/components/employer/ui/EmployerFilterChips";
import EmployerEmptyState from "@/components/employer/ui/EmployerEmptyState";
import { EmployerPrimaryButton } from "@/components/employer/ui/EmployerPageHeader";
import EmployerJobCard from "@/components/employer/EmployerJobCard";
import JobsBoardToolbar, { type SortOption } from "@/components/employer/JobsBoardToolbar";
import type { EmployerJobCardData } from "@/lib/employer-jobs";
import { createEmployerJob, patchJobStatus } from "@/lib/client/jobs";
import { useEmployerShell } from "@/components/employer/EmployerShellContext";
import ProPostAnotherJobCard from "@/components/employer/pro-dashboard/ProPostAnotherJobCard";
import ProButton from "@/components/employer/pro/ProButton";
import ProEmptyState from "@/components/employer/pro/ProEmptyState";

type Props = {
  jobs: EmployerJobCardData[];
  companyVerified: boolean;
};

const FILTER_ALL = "ALL";

const EMPTY_COPY: Record<string, { title: string; description: string }> = {
  ALL: {
    title: "Ready to hire your first Virtual Assistant?",
    description:
      "Create your first job posting to start receiving verified applications from top candidates in the Philippines.",
  },
  ACTIVE: {
    title: "No active job listings",
    description: "Publish a draft or post a new job to start receiving applications.",
  },
  DRAFT: {
    title: "No draft jobs",
    description: "Jobs you save as drafts will appear here before you submit them for review.",
  },
  PENDING_REVIEW: {
    title: "No jobs awaiting review",
    description: "Submitted jobs appear here while an admin verifies your listing.",
  },
  CLOSED: {
    title: "No closed jobs",
    description: "Jobs you close will be archived here for your records.",
  },
};

const SEARCH_EMPTY = {
  title: "No jobs match your search",
  description: "Try a different keyword or clear the search to see all listings.",
};

export default function JobsBoard({ jobs: initialJobs, companyVerified }: Props) {
  const { isPro } = useEmployerShell();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialFilter = searchParams.get("filter") ?? FILTER_ALL;
  const [jobs, setJobs] = useState<EmployerJobCardData[]>(initialJobs);
  const [filter, setFilter] = useState(
    ["ALL", "ACTIVE", "DRAFT", "PENDING_REVIEW", "CLOSED"].includes(initialFilter)
      ? initialFilter
      : FILTER_ALL
  );
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortOption>("updated");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  useEffect(() => {
    setJobs(initialJobs);
  }, [initialJobs]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {
      ALL: jobs.length,
      ACTIVE: 0,
      DRAFT: 0,
      PENDING_REVIEW: 0,
      CLOSED: 0,
    };
    for (const job of jobs) {
      if (job.status in c) c[job.status]++;
    }
    return c;
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    if (filter === FILTER_ALL) return jobs;
    return jobs.filter((j) => j.status === filter);
  }, [jobs, filter]);

  const displayedJobs = useMemo(() => {
    let list = filteredJobs;
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (j) =>
          j.title.toLowerCase().includes(q) ||
          j.location.toLowerCase().includes(q) ||
          j.category.toLowerCase().includes(q) ||
          (j.industry?.toLowerCase().includes(q) ?? false)
      );
    }
    return [...list].sort((a, b) => {
      if (sort === "applicants") return b.applicantCount - a.applicantCount;
      if (sort === "attention") {
        if (a.needsAttention !== b.needsAttention) return a.needsAttention ? -1 : 1;
        if (a.unreviewedCount !== b.unreviewedCount) return b.unreviewedCount - a.unreviewedCount;
        return b.applicantCount - a.applicantCount;
      }
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [filteredJobs, query, sort]);

  async function handleCloseJob(id: string) {
    if (!confirm("Close this job listing? It will no longer accept applications.")) return;

    setLoadingId(id);
    const result = await patchJobStatus(id, "CLOSED");

    if (result.ok) {
      setJobs((prev) =>
        prev.map((j) => (j.id === id ? { ...j, status: "CLOSED", needsAttention: false } : j))
      );
      toast.success("Job closed");
    } else {
      toast.error(result.error ?? "Could not close job");
    }
    setLoadingId(null);
  }

  async function handleDuplicateJob(job: EmployerJobCardData) {
    if (!confirm(`Duplicate "${job.title}"?`)) return;

    setLoadingId(job.id);
    const result = await createEmployerJob({
      title: `${job.title} (Copy)`,
      description: job.description,
      requirements: job.requirements,
      benefits: job.benefits,
      category: job.category,
      industry: job.industry,
      employmentType: job.employmentType,
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      salaryPeriod: job.salaryPeriod,
      location: job.location,
      remoteType: job.remoteType,
      targetHireCount: job.targetHireCount,
      screeningQuestions:
        job.screeningQuestions?.map((q) => ({
          prompt: q.prompt,
          required: q.required,
        })) ?? [],
    });

    if (result.ok) {
      toast.success("Job duplicated");
      router.refresh();
    } else {
      toast.error(result.error ?? "Could not duplicate job");
    }
    setLoadingId(null);
  }

  const filterOptions = [
    { value: FILTER_ALL, label: "All", count: counts.ALL },
    { value: "ACTIVE", label: "Active", count: counts.ACTIVE },
    { value: "DRAFT", label: "Draft", count: counts.DRAFT },
    { value: "PENDING_REVIEW", label: "Pending", count: counts.PENDING_REVIEW },
    { value: "CLOSED", label: "Closed", count: counts.CLOSED },
  ];

  if (jobs.length === 0) {
    const copy = EMPTY_COPY.ALL;
    if (isPro) {
      return (
        <ProEmptyState
          title={
            companyVerified
              ? "Post your first role — it goes live instantly"
              : "Post your first role"
          }
          description={
            companyVerified
              ? "Verified Pro listings skip the admin queue. Unlimited live jobs, and you can feature any of them."
              : "Pro has unlimited listings. Finish company verification to publish instantly — verification is still required."
          }
          action={
            <ProButton href="/employer/jobs/new" variant="primary">
              Post your first job
            </ProButton>
          }
        />
      );
    }
    return (
      <EmployerEmptyState
        title={copy.title}
        description={copy.description}
        action={
          <EmployerPrimaryButton href="/employer/jobs/new">Post your first job</EmployerPrimaryButton>
        }
      />
    );
  }

  return (
    <>
      <EmployerFilterChips options={filterOptions} value={filter} onChange={setFilter} />
      <JobsBoardToolbar
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
              query.trim() ? undefined : filter !== FILTER_ALL ? (
                <ProButton href="/employer/jobs/new" variant="primary">
                  Post a new job
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
              query.trim() ? undefined : filter !== FILTER_ALL ? (
                <EmployerPrimaryButton href="/employer/jobs/new">Post a new job</EmployerPrimaryButton>
              ) : undefined
            }
          />
        )
      ) : (
        <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2 xl:grid-cols-3">
          {displayedJobs.map((job) => (
            <EmployerJobCard
              key={job.id}
              job={job}
              companyVerified={companyVerified}
              loading={loadingId === job.id}
              onDuplicate={() => handleDuplicateJob(job)}
              onClose={() => handleCloseJob(job.id)}
            />
          ))}
          {isPro && filter === FILTER_ALL && !query.trim() && <ProPostAnotherJobCard />}
        </div>
      )}
    </>
  );
}
