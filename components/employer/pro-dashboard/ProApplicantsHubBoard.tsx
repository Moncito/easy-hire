"use client";

import Link from "next/link";
import { Briefcase, ChevronRight, Plus, SearchX, Share2, Users } from "lucide-react";
import { toast } from "sonner";
import {
  Button,
  Card,
  EmptyState,
  FilterButton,
  JobAttentionMessage,
  JobStatusBadge,
  PipelineMini,
  SearchInput,
  Select,
} from "@/components/employer/system";
import {
  HUB_EMPTY_COPY,
  HUB_FILTER_ALL,
  HUB_FILTER_HAS_APPLICANTS,
  HUB_FILTER_NEEDS_REVIEW,
  HUB_SEARCH_EMPTY,
  useApplicantsHub,
  type ApplicantsSortOption,
} from "@/components/employer/jobs/useApplicantsHub";
import { jobCardState } from "@/lib/employer/job-card-state";
import type { EmployerJobCardData } from "@/lib/employer-jobs";

const SORT_OPTIONS: Array<{ value: ApplicantsSortOption; label: string }> = [
  { value: "updated", label: "Recently updated" },
  { value: "applicants", label: "Most applicants" },
  { value: "review", label: "Needs review" },
  { value: "title", label: "A–Z" },
];

const REMOTE: Record<string, string> = { REMOTE: "Remote", ONSITE: "On-site", HYBRID: "Hybrid" };

async function shareListing(job: EmployerJobCardData) {
  const url = `${window.location.origin}/jobs/${job.id}`;
  try {
    if (navigator.share) {
      await navigator.share({ title: job.title, url });
      return;
    }
    await navigator.clipboard.writeText(url);
    toast.success("Listing link copied");
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") return;
    toast.error("Couldn't share. Copy the link from the listing page instead.");
  }
}

function StageCount({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex min-w-0 flex-col-reverse">
      <dt className="text-micro text-eh-muted">{label}</dt>
      <dd className={`num font-heading text-[17px] font-bold leading-tight ${value === 0 ? "text-eh-muted" : "text-eh-ink"}`}>
        {value}
      </dd>
    </div>
  );
}

/**
 * One job in the Applicants hub: which job, its state, where its
 * applicants are, and the next step. Marigold only when applicants are
 * waiting for review — this page is for triage, so the jobs that need you
 * should be the ones that stand out.
 */
function ApplicantsJobRow({ job, companyVerified, now }: { job: EmployerJobCardData; companyVerified: boolean; now: number }) {
  const state = jobCardState(job, companyVerified, new Date(now));
  const severity = state.waiting?.severity ?? "none";
  const href = `/employer/jobs/${job.id}/applicants`;
  const { applied, shortlisted, interview, hired } = job.pipeline;

  const action =
    job.unreviewedCount > 0 ? (
      <Button href={href} variant="primary" icon={<Users />} className="w-full sm:w-auto">
        Review {job.unreviewedCount === 1 ? "applicant" : `${job.unreviewedCount} applicants`}
      </Button>
    ) : job.applicantCount === 0 && state.isPublic ? (
      <Button icon={<Share2 />} onClick={() => void shareListing(job)} className="w-full sm:w-auto">
        Share listing
      </Button>
    ) : (
      <Button href={href} icon={<ChevronRight />} className="w-full sm:w-auto">
        Open pipeline
      </Button>
    );

  return (
    <li
      className={`relative grid gap-4 px-5 py-4 sm:px-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1.3fr)_minmax(0,1fr)_auto] lg:items-center ${
        severity === "critical"
          ? "bg-[color-mix(in_srgb,var(--eh-danger)_3%,var(--eh-surface))]"
          : severity === "attention"
            ? "bg-[color-mix(in_srgb,var(--eh-marigold)_4%,var(--eh-surface))]"
            : ""
      }`}
    >
      {severity !== "none" && (
        <span
          aria-hidden="true"
          className={`absolute inset-y-0 left-0 w-[3px] ${severity === "critical" ? "bg-eh-danger" : "bg-eh-marigold"}`}
        />
      )}

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={href}
            className="min-w-0 truncate text-body font-semibold text-eh-ink transition-colors duration-150 hover:text-eh-marigold-ink"
          >
            {job.title}
          </Link>
          <JobStatusBadge lifecycle={state.lifecycle} severity={severity} />
        </div>
        <p className="mt-1 text-small text-eh-muted">
          {[REMOTE[job.remoteType] ?? job.remoteType, job.location].filter(Boolean).join(" · ")} · Updated{" "}
          {new Date(job.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </p>
        {state.waiting && severity !== "none" && (
          <div className="mt-2.5 max-w-sm">
            <JobAttentionMessage count={state.waiting.count} days={state.waiting.days} severity={severity} />
          </div>
        )}
      </div>

      <dl className="grid grid-cols-4 gap-3">
        <StageCount label="Applied" value={applied} />
        <StageCount label="Shortlisted" value={shortlisted} />
        <StageCount label="Interview" value={interview} />
        <StageCount label="Hired" value={hired} />
      </dl>

      <div className="min-w-0">
        {job.applicantCount > 0 ? (
          <PipelineMini
            className="[&>div:first-child]:h-2"
            stages={[
              {
                label: "Applied",
                value: applied,
                tone: severity === "critical" ? "danger" : severity === "attention" ? "marigold" : "ink",
              },
              { label: "Shortlisted", value: shortlisted, tone: "teal-soft" },
              { label: "In interview", value: interview, tone: "teal" },
              { label: "Hired", value: hired, tone: "teal-strong" },
            ]}
          />
        ) : (
          <div className="h-2 rounded-full bg-eh-line" aria-hidden="true" />
        )}
        <p className="num mt-1.5 text-small text-eh-muted">
          <b className="font-semibold text-eh-ink">{job.applicantCount}</b>{" "}
          {job.applicantCount === 1 ? "applicant" : "applicants"}
        </p>
      </div>

      <div className="lg:justify-self-end">{action}</div>
    </li>
  );
}

/**
 * Pro Applicants hub: every job with its pipeline, filterable by "has
 * applicants", "needs review" and "active". Filtering, search and sort
 * come from useApplicantsHub, shared with the Free board.
 */
export default function ProApplicantsHubBoard({
  jobs,
  companyVerified,
  now,
}: {
  jobs: EmployerJobCardData[];
  companyVerified: boolean;
  now: number;
}) {
  const hub = useApplicantsHub(jobs, { waitingFirst: true });
  const { displayedJobs, filter, query } = hub;
  const searching = query.trim().length > 0;

  if (jobs.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={<Briefcase />}
          title="Post a job to start a pipeline"
          description="Applications land here. Export CSV and rank with Easy AI once seekers apply."
          action={
            <Button href="/employer/jobs/new" variant="primary" icon={<Plus />}>
              Post a job
            </Button>
          }
        />
      </Card>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-3 min-[1181px]:flex-row min-[1181px]:items-center">
        <div role="group" aria-label="Filter jobs" className="flex flex-wrap gap-2">
          {hub.filterOptions.map((option) => (
            <FilterButton
              key={option.value}
              active={filter === option.value}
              count={option.count}
              onClick={() => hub.setFilter(option.value)}
            >
              {option.label}
            </FilterButton>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2 min-[1181px]:ml-auto">
          <SearchInput
            label="Search by title or location"
            value={query}
            onValueChange={hub.setQuery}
            className="w-full sm:w-72"
          />
          <div className="flex items-center gap-2 text-ui text-eh-muted">
            <span aria-hidden="true">Sort</span>
            <Select
              label="Sort jobs"
              value={hub.sort}
              onChange={(v) => hub.setSort(v as ApplicantsSortOption)}
              options={SORT_OPTIONS}
              className="w-44"
            />
          </div>
          <span className="sr-only" role="status" aria-live="polite">
            {displayedJobs.length} {displayedJobs.length === 1 ? "job" : "jobs"}
          </span>
        </div>
      </div>

      {displayedJobs.length === 0 ? (
        <Card className="mt-6">
          <EmptyState
            compact
            icon={searching ? <SearchX /> : <Users />}
            title={searching ? HUB_SEARCH_EMPTY.title : (HUB_EMPTY_COPY[filter]?.title ?? "No jobs found")}
            description={
              searching ? HUB_SEARCH_EMPTY.description : (HUB_EMPTY_COPY[filter]?.description ?? "Try a different filter.")
            }
            action={
              searching ? (
                <Button size="sm" onClick={() => hub.setQuery("")}>
                  Clear search
                </Button>
              ) : filter === HUB_FILTER_ALL ? (
                <Button href="/employer/jobs/new" variant="primary" size="sm" icon={<Plus />}>
                  Post a job
                </Button>
              ) : filter === HUB_FILTER_HAS_APPLICANTS ? (
                <Button href="/employer/jobs" size="sm">
                  View job listings
                </Button>
              ) : filter === HUB_FILTER_NEEDS_REVIEW ? (
                <Button href="/employer/talent" size="sm">
                  Browse talent
                </Button>
              ) : undefined
            }
          />
        </Card>
      ) : (
        <Card padded={false} className="mt-6 overflow-hidden" aria-label="Jobs and their applicants">
          <ul className="divide-y divide-eh-line">
            {displayedJobs.map((job) => (
              <ApplicantsJobRow key={job.id} job={job} companyVerified={companyVerified} now={now} />
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}
