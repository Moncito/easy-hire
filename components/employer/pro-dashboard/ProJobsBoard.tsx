"use client";

import { Briefcase, Plus, SearchX } from "lucide-react";
import { Button, Card, EmptyState, FilterButton, SearchInput, Select } from "@/components/employer/system";
import type { SortOption } from "@/components/employer/JobsBoardToolbar";
import EmployerConfirmModal from "@/components/employer/EmployerConfirmModal";
import { EMPTY_COPY, SEARCH_EMPTY } from "@/components/employer/JobsBoard";
import ProJobCard from "@/components/employer/pro-dashboard/ProJobCard";
import { FILTER_ALL, pendingActionCopy, useJobsBoard } from "@/components/employer/jobs/useJobsBoard";
import type { EmployerJobCardData } from "@/lib/employer-jobs";

const SORT_OPTIONS: Array<{ value: SortOption; label: string }> = [
  { value: "updated", label: "Recently updated" },
  { value: "applicants", label: "Most applicants" },
  { value: "attention", label: "Needs attention" },
];

/**
 * Pro job postings: status filters, search and sort over state-aware
 * JobCards. Behaviour (filters, confirmations, close / duplicate / delete)
 * comes from useJobsBoard, shared with the Free board.
 */
export default function ProJobsBoard({
  jobs: initialJobs,
  companyVerified,
  now,
}: {
  jobs: EmployerJobCardData[];
  companyVerified: boolean;
  now: number;
}) {
  const board = useJobsBoard(initialJobs);
  const { displayedJobs, filter, query, pending, loadingId } = board;
  const copy = pendingActionCopy(pending);
  const searching = query.trim().length > 0;

  if (board.jobs.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={<Briefcase />}
          title={companyVerified ? "Post your first role — it goes live instantly" : "Post your first role"}
          description={
            companyVerified
              ? "Verified Pro listings skip the admin queue. Unlimited live jobs, and you can feature any of them."
              : "Pro has unlimited listings. Finish company verification to publish instantly — verification is still required."
          }
          action={
            <Button href="/employer/jobs/new" variant="primary" icon={<Plus />}>
              Post your first job
            </Button>
          }
        />
      </Card>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-3 min-[1181px]:flex-row min-[1181px]:items-center">
        <div role="group" aria-label="Filter by status" className="flex flex-wrap gap-2">
          {board.filterOptions.map((option) => (
            <FilterButton
              key={option.value}
              active={filter === option.value}
              count={option.count}
              onClick={() => board.setFilter(option.value)}
            >
              {option.label}
            </FilterButton>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2 min-[1181px]:ml-auto">
          <SearchInput
            label="Search by title, location, or category"
            value={query}
            onValueChange={board.setQuery}
            className="w-full sm:w-72"
          />
          <div className="flex items-center gap-2 text-ui text-eh-muted">
            <span aria-hidden="true">Sort</span>
            <Select
              label="Sort job listings"
              value={board.sort}
              onChange={(v) => board.setSort(v as SortOption)}
              options={SORT_OPTIONS}
              className="w-44"
            />
          </div>
          <span className="num sr-only" role="status" aria-live="polite">
            {displayedJobs.length} {displayedJobs.length === 1 ? "listing" : "listings"}
          </span>
        </div>
      </div>

      {displayedJobs.length === 0 ? (
        <Card className="mt-6">
          <EmptyState
            compact
            icon={searching ? <SearchX /> : <Briefcase />}
            title={searching ? SEARCH_EMPTY.title : (EMPTY_COPY[filter]?.title ?? "No jobs found")}
            description={
              searching ? SEARCH_EMPTY.description : (EMPTY_COPY[filter]?.description ?? "Try a different filter.")
            }
            action={
              searching ? (
                <Button size="sm" onClick={() => board.setQuery("")}>
                  Clear search
                </Button>
              ) : filter !== FILTER_ALL ? (
                <Button href="/employer/jobs/new" variant="primary" size="sm" icon={<Plus />}>
                  Post a new job
                </Button>
              ) : undefined
            }
          />
        </Card>
      ) : (
        <div className="mt-6 grid grid-cols-1 items-stretch gap-5 md:grid-cols-2 lg:grid-cols-3">
          {displayedJobs.map((job) => (
            <ProJobCard
              key={job.id}
              job={job}
              companyVerified={companyVerified}
              now={now}
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
