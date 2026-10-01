"use client";

import EmployerFilterChips from "@/components/employer/ui/EmployerFilterChips";
import EmployerEmptyState from "@/components/employer/ui/EmployerEmptyState";
import { EmployerPrimaryButton } from "@/components/employer/ui/EmployerPageHeader";
import EmployerJobCard from "@/components/employer/EmployerJobCard";
import JobsBoardToolbar from "@/components/employer/JobsBoardToolbar";
import type { EmployerJobCardData } from "@/lib/employer-jobs";
import EmployerConfirmModal from "@/components/employer/EmployerConfirmModal";
import { FILTER_ALL, pendingActionCopy, useJobsBoard } from "@/components/employer/jobs/useJobsBoard";

type Props = {
  jobs: EmployerJobCardData[];
  companyVerified: boolean;
};

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

/** The Free plan's job postings board. Pro renders ProJobsBoard instead. */
export default function JobsBoard({ jobs: initialJobs, companyVerified }: Props) {
  const board = useJobsBoard(initialJobs);
  const { displayedJobs, filter, query, pending, loadingId } = board;
  const copy = pendingActionCopy(pending);

  if (board.jobs.length === 0) {
    return (
      <EmployerEmptyState
        title={EMPTY_COPY.ALL.title}
        description={EMPTY_COPY.ALL.description}
        action={<EmployerPrimaryButton href="/employer/jobs/new">Post your first job</EmployerPrimaryButton>}
      />
    );
  }

  return (
    <>
      <EmployerFilterChips options={board.filterOptions} value={filter} onChange={board.setFilter} />
      <JobsBoardToolbar
        query={query}
        onQueryChange={board.setQuery}
        sort={board.sort}
        onSortChange={board.setSort}
        resultCount={displayedJobs.length}
      />

      {displayedJobs.length === 0 ? (
        <EmployerEmptyState
          title={query.trim() ? SEARCH_EMPTY.title : (EMPTY_COPY[filter]?.title ?? "No jobs found")}
          description={
            query.trim() ? SEARCH_EMPTY.description : (EMPTY_COPY[filter]?.description ?? "Try a different filter.")
          }
          action={
            query.trim() ? undefined : filter !== FILTER_ALL ? (
              <EmployerPrimaryButton href="/employer/jobs/new">Post a new job</EmployerPrimaryButton>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2 xl:grid-cols-3">
          {displayedJobs.map((job) => (
            <EmployerJobCard
              key={job.id}
              job={job}
              companyVerified={companyVerified}
              loading={loadingId === job.id}
              onDuplicate={() => board.setPending({ kind: "duplicate", job })}
              onClose={() => board.setPending({ kind: "close", job })}
              onDelete={() => board.setPending({ kind: "delete", job })}
            />
          ))}
        </div>
      )}

      <EmployerConfirmModal
        open={pending !== null}
        title={copy.title}
        subject={pending?.job.title}
        description={copy.description}
        context={copy.context}
        confirmLabel={copy.confirmLabel}
        danger={copy.danger}
        loading={pending !== null && loadingId === pending.job.id}
        onCancel={() => {
          if (loadingId) return;
          board.setPending(null);
        }}
        onConfirm={() => void board.confirmPending()}
      />
    </>
  );
}

export { EMPTY_COPY, SEARCH_EMPTY };
