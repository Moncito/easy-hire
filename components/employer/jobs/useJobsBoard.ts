"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { SortOption } from "@/components/employer/JobsBoardToolbar";
import type { EmployerJobCardData } from "@/lib/employer-jobs";
import { createEmployerJob, deleteEmployerJob, patchJobStatus } from "@/lib/client/jobs";

export const FILTER_ALL = "ALL";
const FILTERS = ["ALL", "ACTIVE", "DRAFT", "PENDING_REVIEW", "CLOSED"];

export type PendingJobAction = { kind: "close" | "duplicate" | "delete"; job: EmployerJobCardData };

/**
 * State and actions of the job postings board — filter (seeded from
 * `?filter=`), search, sort, and close / duplicate / delete with their
 * confirmation step. Shared by the Free and Pro boards so both behave
 * identically and only differ in how they look.
 */
export function useJobsBoard(initialJobs: EmployerJobCardData[]) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialFilter = searchParams.get("filter") ?? FILTER_ALL;
  const [jobs, setJobs] = useState<EmployerJobCardData[]>(initialJobs);
  const [filter, setFilter] = useState(FILTERS.includes(initialFilter) ? initialFilter : FILTER_ALL);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortOption>("updated");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingJobAction | null>(null);

  // Fresh server data (router.refresh after duplicate) replaces local edits.
  // Reset during render rather than in an effect, so there's no stale frame.
  const [syncedJobs, setSyncedJobs] = useState(initialJobs);
  if (syncedJobs !== initialJobs) {
    setSyncedJobs(initialJobs);
    setJobs(initialJobs);
  }

  const counts = useMemo(() => {
    const c: Record<string, number> = { ALL: jobs.length, ACTIVE: 0, DRAFT: 0, PENDING_REVIEW: 0, CLOSED: 0 };
    for (const job of jobs) {
      if (job.status in c) c[job.status]++;
    }
    return c;
  }, [jobs]);

  const displayedJobs = useMemo(() => {
    let list = filter === FILTER_ALL ? jobs : jobs.filter((j) => j.status === filter);
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
  }, [jobs, filter, query, sort]);

  async function handleCloseJob(job: EmployerJobCardData) {
    setLoadingId(job.id);
    const result = await patchJobStatus(job.id, "CLOSED");
    if (result.ok) {
      setJobs((prev) =>
        prev.map((j) => (j.id === job.id ? { ...j, status: "CLOSED", needsAttention: false } : j))
      );
      toast.success("Job closed");
      setPending(null);
    } else {
      toast.error(result.error ?? "Could not close job");
    }
    setLoadingId(null);
  }

  async function handleDuplicateJob(job: EmployerJobCardData) {
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
      screeningQuestions: job.screeningQuestions?.map((q) => ({ prompt: q.prompt, required: q.required })) ?? [],
    });
    if (result.ok) {
      toast.success("Job duplicated");
      setPending(null);
      router.refresh();
    } else {
      toast.error(result.error ?? "Could not duplicate job");
    }
    setLoadingId(null);
  }

  async function handleDeleteDraft(job: EmployerJobCardData) {
    setLoadingId(job.id);
    const result = await deleteEmployerJob(job.id);
    if (result.ok) {
      setJobs((prev) => prev.filter((j) => j.id !== job.id));
      toast.success("Draft deleted");
      setPending(null);
    } else {
      toast.error(result.error ?? "Could not delete draft");
    }
    setLoadingId(null);
  }

  function confirmPending() {
    if (!pending) return;
    if (pending.kind === "close") return handleCloseJob(pending.job);
    if (pending.kind === "duplicate") return handleDuplicateJob(pending.job);
    return handleDeleteDraft(pending.job);
  }

  const filterOptions = [
    { value: FILTER_ALL, label: "All", count: counts.ALL },
    { value: "ACTIVE", label: "Active", count: counts.ACTIVE },
    { value: "DRAFT", label: "Draft", count: counts.DRAFT },
    { value: "PENDING_REVIEW", label: "Pending", count: counts.PENDING_REVIEW },
    { value: "CLOSED", label: "Closed", count: counts.CLOSED },
  ];

  return {
    jobs,
    displayedJobs,
    filter,
    setFilter,
    filterOptions,
    query,
    setQuery,
    sort,
    setSort,
    loadingId,
    pending,
    setPending,
    confirmPending,
  };
}

/** Title, copy and button label for the close / duplicate / delete confirmation. */
export function pendingActionCopy(pending: PendingJobAction | null): {
  title: string;
  description: string;
  /** A fact about what the action affects, shown under the description. */
  context?: string;
  confirmLabel: string;
  danger: boolean;
} {
  if (!pending) return { title: "", description: "", confirmLabel: "", danger: false };
  if (pending.kind === "delete") {
    return {
      title: "Delete this draft?",
      description: "This draft will be removed permanently. You can’t undo this.",
      confirmLabel: "Delete draft",
      danger: true,
    };
  }
  if (pending.kind === "close") {
    const { applied, shortlisted, interview } = pending.job.pipeline;
    const inPipeline = applied + shortlisted + interview;
    return {
      title: "Close this job?",
      description:
        "Closing this job stops new applications and removes it from active listings. Existing applicants stay accessible.",
      context:
        inPipeline > 0
          ? `${inPipeline} ${inPipeline === 1 ? "applicant is" : "applicants are"} currently in your hiring pipeline.`
          : undefined,
      confirmLabel: "Close job",
      danger: true,
    };
  }
  return {
    title: "Duplicate this job?",
    description: "A new draft copy will be created. The original listing is unchanged.",
    confirmLabel: "Duplicate",
    danger: false,
  };
}
