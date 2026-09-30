"use client";

import Link from "next/link";
import { Briefcase, Plus, SearchX } from "lucide-react";
import { Button, Card, EmptyState, FilterButton, SearchInput } from "@/components/employer/system";
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

function PostAnotherRoleCard() {
  return (
    <Link
      href="/employer/jobs/new"
      className="group flex h-full min-h-[160px] flex-col md:min-h-[280px] items-center justify-center gap-2 rounded-card border border-dashed border-eh-line bg-transparent p-6 text-center transition-colors duration-150 hover:border-eh-muted hover:bg-eh-surface"
    >
      <span className="grid h-10 w-10 place-items-center rounded-full bg-eh-marigold text-[#241500]" aria-hidden="true">
        <Plus className="h-5 w-5" strokeWidth={2.25} />
      </span>
      <span className="mt-1 text-body font-semibold text-eh-ink">Post another role</span>
      <span className="max-w-[240px] text-small text-eh-muted">
        Pro has no live-job cap. More listings mean more VAs find you.
      </span>
    </Link>
  );
}

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
          <label className="flex items-center gap-2 text-ui text-eh-muted">
            Sort
            <select
              value={board.sort}
              onChange={(e) => board.setSort(e.target.value as SortOption)}
              className="h-9 rounded-control border border-eh-line bg-eh-surface px-2.5 text-ui text-eh-ink transition-colors duration-150 hover:border-eh-muted"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
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
        <div className="mt-6 grid grid-cols-1 items-stretch gap-4 md:grid-cols-2 min-[1181px]:grid-cols-3">
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
          {filter === FILTER_ALL && !searching && <PostAnotherRoleCard />}
        </div>
      )}

      <EmployerConfirmModal
        open={pending !== null}
        title={copy.title}
        subject={pending?.job.title}
        description={copy.description}
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
