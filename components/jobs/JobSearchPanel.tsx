"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { Search, Loader2, SlidersHorizontal, X, Sparkles } from "lucide-react";
import JobListingCard, { type JobCardData } from "@/components/jobs/JobListingCard";
import JobListRow from "@/components/jobs/JobListRow";
import JobDetailPanel from "@/components/jobs/JobDetailPanel";
import SaveSearchButton from "@/components/jobs/SaveSearchButton";
import JobFiltersPanel from "@/components/jobs/JobFiltersPanel";
import { JobSearchSplitSkeleton } from "@/components/jobs/JobPageSkeletons";
import { type SalaryPeriod } from "@/lib/format";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";

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

const salaryPeriodOptions: { value: SalaryPeriod; label: string }[] = [
  { value: "MONTHLY", label: "Monthly" },
  { value: "HOURLY", label: "Hourly" },
  { value: "ANNUAL", label: "Annual" },
];

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

/** Equal width for filter + job list columns in the desktop workspace. */
const DESKTOP_COLUMN_WIDTH = 320;

export default function JobSearchPanel() {
  const { data: session } = useSession();
  const [query, setQuery] = useState("");
  const [committedQuery, setCommittedQuery] = useState("");
  const [category, setCategory] = useState("");
  const [industry, setIndustry] = useState("");
  const [location, setLocation] = useState("");
  const [employmentType, setEmploymentType] = useState("");
  const [remoteType, setRemoteType] = useState("");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [salaryPeriod, setSalaryPeriod] = useState<SalaryPeriod>("MONTHLY");
  const [postedWithin, setPostedWithin] = useState("");
  const debouncedLocation = useDebouncedValue(location, 450);
  const debouncedSalaryMin = useDebouncedValue(salaryMin, 450);
  const debouncedSalaryMax = useDebouncedValue(salaryMax, 450);
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

  const fetchJobs = useCallback(
    async (opts: { append?: boolean; searchCursor?: string | null; q?: string } = {}) => {
      const searchQ = opts.q ?? committedQuery;
      const params = new URLSearchParams();
      if (searchQ) params.set("q", searchQ);
      if (category) params.set("category", category);
      if (industry) params.set("industry", industry);
      if (debouncedLocation) params.set("location", debouncedLocation);
      if (employmentType) params.set("employmentType", employmentType);
      if (remoteType) params.set("remoteType", remoteType);
      if (debouncedSalaryMin) params.set("salaryMin", debouncedSalaryMin);
      if (debouncedSalaryMax) params.set("salaryMax", debouncedSalaryMax);
      if (debouncedSalaryMin || debouncedSalaryMax) params.set("salaryPeriod", salaryPeriod);
      if (postedWithin) params.set("postedWithin", postedWithin);
      if (sort !== "newest") params.set("sort", sort);
      if (opts.searchCursor) params.set("cursor", opts.searchCursor);

      const res = await fetch(`/api/jobs/search?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to load jobs");
      }

      const nextJobs: JobCardData[] = data.jobs ?? [];

      setNextCursor(data.nextCursor ?? null);
      setJobs((prev) => (opts.append ? [...prev, ...nextJobs] : nextJobs));
    },
    [
      committedQuery,
      category,
      industry,
      debouncedLocation,
      employmentType,
      remoteType,
      debouncedSalaryMin,
      debouncedSalaryMax,
      salaryPeriod,
      postedWithin,
      sort,
    ]
  );

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setLoading(true);
      setError("");
      setCursor(null);
      try {
        await fetchJobs();
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load jobs");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [fetchJobs]);

  useEffect(() => {
    if (session?.user?.role !== "SEEKER") return;
    fetch("/api/applications/list")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.jobIds) setAppliedIds(new Set(data.jobIds as string[]));
      })
      .catch(() => {});
    fetch("/api/seeker/jobs/saved")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.jobIds) setSavedIds(new Set(data.jobIds as string[]));
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
        const nextIdx = Math.min(currentIdx + 1, jobs.length - 1);
        setSelectedJobId(jobs[nextIdx].id);
        return;
      }

      if (e.key === "ArrowUp" || (e.key === "k" && !e.metaKey && !e.ctrlKey)) {
        e.preventDefault();
        const nextIdx = Math.max(currentIdx - 1, 0);
        setSelectedJobId(jobs[nextIdx].id);
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

  async function handleSearch(e?: React.FormEvent) {
    e?.preventDefault();
    const nextQuery = query.trim();
    setCommittedQuery(nextQuery);
    setLoading(true);
    setError("");
    try {
      await fetchJobs({ q: nextQuery });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }

  async function applySalaryPreset(min: number) {
    setSalaryMin(String(min));
    setSalaryMax("");
    setSalaryPeriod("MONTHLY");
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (committedQuery) params.set("q", committedQuery);
      if (category) params.set("category", category);
      if (industry) params.set("industry", industry);
      if (debouncedLocation) params.set("location", debouncedLocation);
      if (employmentType) params.set("employmentType", employmentType);
      if (remoteType) params.set("remoteType", remoteType);
      params.set("salaryMin", String(min));
      params.set("salaryPeriod", "MONTHLY");
      if (postedWithin) params.set("postedWithin", postedWithin);
      if (sort !== "newest") params.set("sort", sort);

      const res = await fetch(`/api/jobs/search?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load jobs");
      setNextCursor(data.nextCursor ?? null);
      setJobs(data.jobs ?? []);
      setCursor(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }

  async function loadMore() {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      await fetchJobs({ append: true, searchCursor: nextCursor });
      setCursor(nextCursor);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load more");
    } finally {
      setLoadingMore(false);
    }
  }

  const activeFilterCount = [
    category,
    industry,
    location,
    employmentType,
    remoteType,
    salaryMin,
    salaryMax,
    postedWithin,
  ].filter(Boolean).length;

  const searchSummary = [committedQuery, category, location].filter(Boolean).join(" · ");
  const canSaveSearch = session?.user?.role === "SEEKER" && (committedQuery || activeFilterCount > 0);

  const filterPanelProps = {
    location,
    onLocationChange: setLocation,
    category,
    onCategoryChange: setCategory,
    industry,
    onIndustryChange: setIndustry,
    employmentType,
    onEmploymentTypeChange: setEmploymentType,
    remoteType,
    onRemoteTypeChange: setRemoteType,
    salaryMin,
    onSalaryMinChange: setSalaryMin,
    salaryMax,
    onSalaryMaxChange: setSalaryMax,
    salaryPeriod,
    onSalaryPeriodChange: setSalaryPeriod,
    postedWithin,
    onPostedWithinChange: setPostedWithin,
    onSalaryPreset: applySalaryPreset,
    onSubmit: handleSearch,
    loading,
    activeFilterCount,
    employmentOptions,
    remoteOptions,
    salaryPeriodOptions,
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
            key={`${searchSummary}-${category}-${industry}`}
            keywords={searchSummary || "All VA jobs"}
            category={category || industry || undefined}
          />
        )}
        <label className="flex items-center gap-2 text-xs font-semibold text-ink/60">
          Sort:
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="rounded-lg border border-navy/10 bg-white px-2.5 py-1.5 text-xs font-semibold text-ink outline-none focus:border-marigold"
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <span className="hidden text-[10px] text-ink/35 lg:inline" title="Keyboard shortcuts">
          ↑↓ or J/K to browse
        </span>
      </div>
    </div>
  );

  const desktopSearchBar = (
    <form
      onSubmit={handleSearch}
      className="relative"
    >
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/35" />
      <input
        id="job-search-desktop"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search roles, skills, companies..."
        className="w-full rounded-xl border border-navy/10 bg-white/90 py-2.5 pl-9 pr-3 text-sm outline-none backdrop-blur-sm transition focus:border-marigold focus:ring-2 focus:ring-marigold/20"
      />
    </form>
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Mobile / tablet: stacked layout */}
      <div className="lg:hidden">
        <aside className="mb-6">
          <div className="rounded-2xl border border-navy/10 bg-white p-4 shadow-[0_8px_30px_rgba(30,58,95,0.06)] sm:p-5">
            <div className="mb-3 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setFiltersOpen((o) => !o)}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-navy/10 px-3 py-1.5 text-xs font-semibold text-ink/70"
              >
                {filtersOpen ? <X className="h-3.5 w-3.5" /> : <SlidersHorizontal className="h-3.5 w-3.5" />}
                {filtersOpen ? "Close filters" : "Open filters"}
              </button>
            </div>
            <div className={`${filtersOpen ? "block" : "hidden"}`}>
              <JobFiltersPanel variant="mobile" query={query} onQueryChange={setQuery} {...filterPanelProps} />
            </div>
          </div>
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
            <div className="rounded-2xl border border-navy/8 bg-white p-14 text-center sm:p-16">
              <h2 className="font-display text-xl font-bold text-ink">No jobs found</h2>
              <p className="mt-2 text-sm text-ink/50">
                Try different filters or check back soon for new VA roles.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-5">{resultsToolbar}</div>
              <div className="grid grid-cols-1 gap-5">
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
                    className="cursor-pointer rounded-full border border-navy/15 bg-white px-8 py-3 text-sm font-semibold text-ink/70 transition hover:border-navy/30 hover:bg-mist disabled:opacity-60"
                  >
                    {loadingMore ? "Loading..." : "Load more jobs"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Desktop: unified three-column workspace (filters | list | detail) */}
      <div className="hidden min-h-0 flex-1 flex-col lg:flex">
        {error && (
          <div className="mb-5 rounded-xl border border-ember/20 bg-ember/5 px-4 py-3 text-sm text-ember">
            {error}
          </div>
        )}

        {loading ? (
          <JobSearchSplitSkeleton columnWidth={DESKTOP_COLUMN_WIDTH} />
        ) : jobs.length === 0 ? (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-navy/10 bg-white shadow-[0_12px_40px_rgba(30,58,95,0.08)]">
            <div className="h-1 bg-gradient-to-r from-marigold via-teal/70 to-navy" aria-hidden="true" />
            <div className="flex min-h-0 flex-1">
              <aside
                className="jobs-workspace-scroll shrink-0 overflow-y-auto border-r border-navy/8 bg-gradient-to-b from-navy/[0.04] to-mist/60 p-5"
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
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-navy/10 bg-white shadow-[0_12px_40px_rgba(30,58,95,0.08)]">
            <div className="h-1 shrink-0 bg-gradient-to-r from-marigold via-teal/70 to-navy" aria-hidden="true" />
            <div className="flex min-h-0 flex-1">
              <aside
                className="jobs-workspace-scroll flex min-h-0 shrink-0 flex-col border-r border-navy/8 bg-gradient-to-b from-navy/[0.04] via-mist/40 to-mist/70"
                style={{ width: DESKTOP_COLUMN_WIDTH }}
              >
                <div className="jobs-workspace-scroll min-h-0 flex-1 overflow-y-auto p-5">
                  <JobFiltersPanel variant="desktop" {...filterPanelProps} />
                </div>
              </aside>

              <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-mist/20">
                <div className="flex h-full min-h-0 flex-1">
                  <div
                    className="flex h-full min-h-0 shrink-0 flex-col border-r border-ink/5 bg-white"
                    style={{ width: DESKTOP_COLUMN_WIDTH }}
                  >
                    <div className="sticky top-0 z-10 shrink-0 space-y-3 border-b border-ink/5 bg-white/85 p-3 backdrop-blur-md">
                      {desktopSearchBar}
                      {resultsToolbar}
                    </div>
                    <div
                      ref={jobListRef}
                      role="listbox"
                      aria-label="Job results"
                      aria-activedescendant={activeJobId ? `job-option-${activeJobId}` : undefined}
                      className="jobs-workspace-scroll min-h-0 flex-1 overflow-y-auto p-2 focus:outline-none"
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
                          className="cursor-pointer rounded-full border border-navy/15 bg-white px-5 py-2 text-xs font-semibold text-ink/70 transition hover:border-navy/30 hover:bg-mist disabled:opacity-60"
                        >
                          {loadingMore ? "Loading..." : "Load more jobs"}
                        </button>
                      </div>
                    )}
                    </div>
                  </div>

                  <div className="jobs-workspace-scroll min-h-0 min-w-0 flex-1 overflow-y-auto bg-gradient-to-b from-white via-white to-mist/30">
                    {activeJobId ? (
                      <JobDetailPanel
                        jobId={activeJobId}
                        saved={savedIds.has(activeJobId)}
                        onToggleSaved={handleToggleSaved}
                      />
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center gap-3 p-12 text-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-marigold/10 text-marigold">
                          <Sparkles className="h-6 w-6" aria-hidden="true" />
                        </div>
                        <p className="font-display text-sm font-semibold text-ink/70">Select a job to preview</p>
                        <p className="max-w-xs text-xs text-ink/45">
                          Browse the list or use ↑↓ to compare roles side by side.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
