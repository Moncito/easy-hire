"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { Search, Loader2, SlidersHorizontal, X, Sparkles } from "lucide-react";
import JobListingCard, { type JobCardData } from "@/components/jobs/JobListingCard";
import JobListRow from "@/components/jobs/JobListRow";
import JobDetailPanel from "@/components/jobs/JobDetailPanel";
import SaveSearchButton from "@/components/jobs/SaveSearchButton";
import JobFiltersPanel from "@/components/jobs/JobFiltersPanel";
import FilterIconSelect from "@/components/jobs/FilterIconSelect";
import { JobSearchSplitSkeleton } from "@/components/jobs/JobPageSkeletons";
import { searchJobs } from "@/lib/client/jobs";
import { listSeekerApplications, listSavedJobIds } from "@/lib/client/applications";
import {
  buildJobSearchParams,
  countActiveFilters,
  emptyJobFilters,
  filtersEqual,
  type JobFilterState,
} from "@/components/jobs/job-filter-state";

const employmentOptions = [
  { value: "", label: "Any type" },
  { value: "FULL_TIME", label: "Full-time" },
  { value: "PART_TIME", label: "Part-time" },
  { value: "CONTRACT", label: "Contract" },
];

const remoteOptions = [
  { value: "", label: "Any setup" },
  { value: "REMOTE", label: "Remote" },
  { value: "HYBRID", label: "Hybrid" },
  { value: "ONSITE", label: "On-site" },
];

const salaryPeriodOptions = [
  { value: "MONTHLY", label: "Monthly" },
  { value: "HOURLY", label: "Hourly" },
  { value: "ANNUAL", label: "Annual" },
] as const;

const postedWithinOptions = [
  { value: "", label: "Any time" },
  { value: "24h", label: "Last 24 hours" },
  { value: "3d", label: "Last 3 days" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
];

const sortOptions = [
  { value: "newest", label: "Newest" },
  { value: "salary_high", label: "Highest pay" },
];

const DESKTOP_COLUMN_WIDTH = 320;

async function requestJobs(
  filters: JobFilterState,
  opts: { q?: string; sort?: string; cursor?: string | null } = {}
) {
  const params = buildJobSearchParams(filters, opts);
  return searchJobs(params) as Promise<{ jobs: JobCardData[]; nextCursor: string | null }>;
}

export default function JobSearchPanel() {
  const { data: session } = useSession();
  const [query, setQuery] = useState("");
  const [committedQuery, setCommittedQuery] = useState("");
  const [draftFilters, setDraftFilters] = useState<JobFilterState>(emptyJobFilters);
  const [appliedFilters, setAppliedFilters] = useState<JobFilterState>(emptyJobFilters);
  const [sort, setSort] = useState("newest");
  const [jobs, setJobs] = useState<JobCardData[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const jobListRef = useRef<HTMLDivElement>(null);

  const hasPendingFilters = !filtersEqual(draftFilters, appliedFilters);

  const patchDraft = useCallback((patch: Partial<JobFilterState>) => {
    setDraftFilters((prev) => ({ ...prev, ...patch }));
  }, []);

  const runSearch = useCallback(
    async (
      filters: JobFilterState,
      opts: { q?: string; sort?: string; append?: boolean; searchCursor?: string | null } = {}
    ) => {
      const data = await requestJobs(filters, {
        q: opts.q ?? committedQuery,
        sort: opts.sort ?? sort,
        cursor: opts.searchCursor ?? undefined,
      });
      setNextCursor(data.nextCursor ?? null);
      setJobs((prev) => (opts.append ? [...prev, ...(data.jobs ?? [])] : data.jobs ?? []));
    },
    [committedQuery, sort]
  );

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError("");
      setCursor(null);
      try {
        await runSearch(appliedFilters);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load jobs");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial load only
  }, []);

  useEffect(() => {
    if (session?.user?.role !== "SEEKER") return;
    listSeekerApplications()
      .then((data) => {
        if (data && typeof data === "object" && "jobIds" in data) {
          setAppliedIds(new Set((data as { jobIds: string[] }).jobIds));
        }
      })
      .catch(() => {});
    listSavedJobIds()
      .then((data) => {
        if (data && typeof data === "object" && "jobIds" in data) {
          setSavedIds(new Set((data as { jobIds: string[] }).jobIds));
        }
      })
      .catch(() => {});
  }, [session?.user?.role]);

  const activeJobId =
    jobs.length === 0
      ? null
      : selectedJobId && jobs.some((j) => j.id === selectedJobId)
        ? selectedJobId
        : jobs[0].id;

  useEffect(() => {
    if (!activeJobId || !jobListRef.current) return;
    const row = jobListRef.current.querySelector<HTMLElement>(`[data-job-id="${activeJobId}"]`);
    row?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [activeJobId]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        target.isContentEditable
      ) {
        return;
      }

      if (jobs.length === 0) return;

      const idx = jobs.findIndex((j) => j.id === activeJobId);
      const currentIdx = idx >= 0 ? idx : 0;

      if (e.key === "ArrowDown" || (e.key === "j" && !e.metaKey && !e.ctrlKey)) {
        e.preventDefault();
        setSelectedJobId(jobs[Math.min(currentIdx + 1, jobs.length - 1)].id);
        return;
      }

      if (e.key === "ArrowUp" || (e.key === "k" && !e.metaKey && !e.ctrlKey)) {
        e.preventDefault();
        setSelectedJobId(jobs[Math.max(currentIdx - 1, 0)].id);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [jobs, activeJobId]);

  function handleToggleSaved(jobId: string, nextSaved: boolean) {
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (nextSaved) next.add(jobId);
      else next.delete(jobId);
      return next;
    });
  }

  async function handleSortChange(next: string) {
    setSort(next);
    setLoading(true);
    setError("");
    setCursor(null);
    try {
      await runSearch(appliedFilters, { sort: next });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load jobs");
    } finally {
      setLoading(false);
    }
  }

  async function handleApplyFilters(e?: React.FormEvent) {
    e?.preventDefault();
    const nextQuery = query.trim();
    setCommittedQuery(nextQuery);
    setAppliedFilters(draftFilters);
    setLoading(true);
    setError("");
    setCursor(null);
    try {
      await runSearch(draftFilters, { q: nextQuery });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleKeywordSearch(e?: React.FormEvent) {
    e?.preventDefault();
    const nextQuery = query.trim();
    setCommittedQuery(nextQuery);
    setLoading(true);
    setError("");
    setCursor(null);
    try {
      await runSearch(appliedFilters, { q: nextQuery });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }

  function handleSalaryPreset(min: number) {
    patchDraft({ salaryMin: String(min), salaryMax: "", salaryPeriod: "MONTHLY" });
  }

  async function loadMore() {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      await runSearch(appliedFilters, { append: true, searchCursor: nextCursor });
      setCursor(nextCursor);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load more");
    } finally {
      setLoadingMore(false);
    }
  }

  const appliedFilterCount = countActiveFilters(appliedFilters);
  const searchSummary = [committedQuery, appliedFilters.category, appliedFilters.location]
    .filter(Boolean)
    .join(" · ");
  const canSaveSearch =
    session?.user?.role === "SEEKER" && (committedQuery || appliedFilterCount > 0);

  const filterPanelProps = {
    location: draftFilters.location,
    onLocationChange: (v: string) => patchDraft({ location: v }),
    category: draftFilters.category,
    onCategoryChange: (v: string) => patchDraft({ category: v }),
    industry: draftFilters.industry,
    onIndustryChange: (v: string) => patchDraft({ industry: v }),
    employmentType: draftFilters.employmentType,
    onEmploymentTypeChange: (v: string) => patchDraft({ employmentType: v }),
    remoteType: draftFilters.remoteType,
    onRemoteTypeChange: (v: string) => patchDraft({ remoteType: v }),
    salaryMin: draftFilters.salaryMin,
    onSalaryMinChange: (v: string) => patchDraft({ salaryMin: v }),
    salaryMax: draftFilters.salaryMax,
    onSalaryMaxChange: (v: string) => patchDraft({ salaryMax: v }),
    salaryPeriod: draftFilters.salaryPeriod,
    onSalaryPeriodChange: (v: JobFilterState["salaryPeriod"]) => patchDraft({ salaryPeriod: v }),
    postedWithin: draftFilters.postedWithin,
    onPostedWithinChange: (v: string) => patchDraft({ postedWithin: v }),
    onSalaryPreset: handleSalaryPreset,
    onSubmit: handleApplyFilters,
    loading,
    activeFilterCount: appliedFilterCount,
    hasPendingChanges: hasPendingFilters,
    employmentOptions,
    remoteOptions,
    salaryPeriodOptions: [...salaryPeriodOptions],
    postedWithinOptions,
  };

  const resultsToolbar = (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="font-data text-sm font-medium text-ink/55">
        <span className="font-semibold text-ink">{jobs.length}</span>{" "}
        {jobs.length === 1 ? "job" : "jobs"} found
        {cursor ? " (showing more)" : ""}
      </p>
      <div className="flex items-center gap-2">
        {canSaveSearch && (
          <SaveSearchButton
            key={`${searchSummary}-${appliedFilters.category}-${appliedFilters.industry}`}
            keywords={searchSummary || "All VA jobs"}
            category={appliedFilters.category || appliedFilters.industry || undefined}
          />
        )}
        <label className="flex items-center gap-2 text-xs font-semibold text-ink/60">
          Sort
          <FilterIconSelect
            value={sort}
            onChange={handleSortChange}
            options={sortOptions}
            ariaLabel="Sort jobs"
            compact
          />
        </label>
        <span className="hidden text-[10px] text-ink/35 lg:inline" title="Keyboard shortcuts">
          ↑↓ or J/K to browse
        </span>
      </div>
    </div>
  );

  const desktopSearchBar = (
    <form onSubmit={handleKeywordSearch} className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/35" />
      <input
        id="job-search-desktop"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search roles, skills, companies..."
        className="w-full rounded-xl border border-ink/10 bg-mist/50 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-marigold focus:ring-2 focus:ring-marigold/20"
      />
    </form>
  );

  const desktopWorkspace = (
    <>
      {loading ? (
        <JobSearchSplitSkeleton columnWidth={DESKTOP_COLUMN_WIDTH} />
      ) : jobs.length === 0 ? (
        <div className="flex min-h-0 flex-1 overflow-hidden">
          <aside
            className="jobs-workspace-scroll shrink-0 overflow-y-auto border-r border-ink/[0.06] p-5"
            style={{ width: DESKTOP_COLUMN_WIDTH }}
          >
            <JobFiltersPanel variant="desktop" {...filterPanelProps} />
          </aside>
          <div className="flex flex-1 items-center justify-center p-16 text-center">
            <div>
              <h2 className="font-display text-xl font-bold text-ink">No jobs found</h2>
              <p className="mt-2 text-sm text-ink/50">
                Try different filters or check back soon for new VA roles.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 overflow-hidden">
          <aside
            className="jobs-workspace-scroll flex min-h-0 shrink-0 flex-col border-r border-ink/[0.06]"
            style={{ width: DESKTOP_COLUMN_WIDTH }}
          >
            <div className="jobs-workspace-scroll min-h-0 flex-1 overflow-y-auto p-5">
              <JobFiltersPanel variant="desktop" {...filterPanelProps} />
            </div>
          </aside>

          <div
            className="flex h-full min-h-0 shrink-0 flex-col border-r border-ink/[0.06]"
            style={{ width: DESKTOP_COLUMN_WIDTH }}
          >
            <div className="sticky top-0 z-10 shrink-0 space-y-3 border-b border-ink/[0.06] bg-mist/55 p-3 backdrop-blur-md">
              {desktopSearchBar}
              {resultsToolbar}
            </div>
            <div
              ref={jobListRef}
              role="listbox"
              aria-label="Job results"
              aria-activedescendant={activeJobId ? `job-option-${activeJobId}` : undefined}
              className="jobs-workspace-scroll min-h-0 flex-1 overflow-y-auto px-1 py-1 focus:outline-none"
              tabIndex={0}
            >
              {jobs.map((job) => (
                <div key={job.id} id={`job-option-${job.id}`}>
                  <JobListRow
                    job={job}
                    active={activeJobId === job.id}
                    applied={appliedIds.has(job.id)}
                    saved={savedIds.has(job.id)}
                    onToggleSaved={handleToggleSaved}
                    onSelect={setSelectedJobId}
                  />
                </div>
              ))}
              {nextCursor && (
                <div className="p-3 text-center">
                  <button
                    type="button"
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="cursor-pointer rounded-full border border-ink/15 px-5 py-2 text-xs font-semibold text-ink/70 transition hover:border-ink/30 hover:bg-ink/[0.03] disabled:opacity-60"
                  >
                    {loadingMore ? "Loading..." : "Load more jobs"}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="jobs-workspace-scroll min-h-0 min-w-0 flex-1 overflow-y-auto">
            {activeJobId ? (
              <JobDetailPanel
                jobId={activeJobId}
                saved={savedIds.has(activeJobId)}
                onToggleSaved={handleToggleSaved}
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3 p-12 text-center">
                <Sparkles className="h-8 w-8 text-marigold/70" aria-hidden="true" />
                <p className="font-display text-sm font-semibold text-ink/70">Select a job to preview</p>
                <p className="max-w-xs text-xs text-ink/45">
                  Browse the list or use ↑↓ to compare roles side by side.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <div className="lg:hidden">
        <aside className="mb-4 border-b border-ink/[0.06] pb-4">
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setFiltersOpen((o) => !o)}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-ink/10 px-3 py-1.5 text-xs font-semibold text-ink/70"
            >
              {filtersOpen ? <X className="h-3.5 w-3.5" /> : <SlidersHorizontal className="h-3.5 w-3.5" />}
              {filtersOpen ? "Close filters" : "Open filters"}
            </button>
          </div>
          {filtersOpen && (
            <JobFiltersPanel variant="mobile" query={query} onQueryChange={setQuery} {...filterPanelProps} />
          )}
        </aside>

        <div className="min-w-0">
          {error && (
            <div className="mb-5 rounded-xl border border-ember/20 bg-ember/5 px-4 py-3 text-sm text-ember">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-24 text-ink/45">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
              Loading jobs...
            </div>
          ) : jobs.length === 0 ? (
            <div className="py-14 text-center">
              <h2 className="font-display text-xl font-bold text-ink">No jobs found</h2>
              <p className="mt-2 text-sm text-ink/50">
                Try different filters or check back soon for new VA roles.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-5">{resultsToolbar}</div>
              <div className="divide-y divide-ink/[0.06]">
                {jobs.map((job) => (
                  <JobListingCard
                    key={job.id}
                    job={job}
                    applied={appliedIds.has(job.id)}
                    saved={savedIds.has(job.id)}
                    onToggleSaved={handleToggleSaved}
                  />
                ))}
              </div>
              {nextCursor && (
                <div className="mt-10 text-center">
                  <button
                    type="button"
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="cursor-pointer rounded-full border border-ink/15 px-8 py-3 text-sm font-semibold text-ink/70 transition hover:border-ink/30 hover:bg-ink/[0.03] disabled:opacity-60"
                  >
                    {loadingMore ? "Loading..." : "Load more jobs"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="hidden min-h-0 flex-1 flex-col lg:flex">
        {error && (
          <div className="shrink-0 border-b border-ember/15 bg-ember/5 px-4 py-3 text-sm text-ember">
            {error}
          </div>
        )}
        {desktopWorkspace}
      </div>
    </div>
  );
}
